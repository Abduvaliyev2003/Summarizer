<?php

namespace Tests\Feature;

use App\Mail\WeeklyDigestMail;
use App\Models\PdfSummary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NewFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_toggle_share_link_for_summary(): void
    {
        $user = User::factory()->create();
        $summary = PdfSummary::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'summary' => 'Test summary content',
            'target_language' => 'en',
        ]);

        $response = $this->actingAs($user)->postJson("/history/{$summary->id}/share");

        $response->assertOk()
            ->assertJson([
                'shared' => true,
            ]);

        $summary->refresh();
        $this->assertTrue($summary->is_shared);
        $this->assertNotNull($summary->share_token);

        // Test public view page
        $publicResponse = $this->get("/s/{$summary->share_token}");
        $publicResponse->assertOk();
    }

    public function test_unshared_summary_cannot_be_viewed_publicly(): void
    {
        $response = $this->get('/s/invalid_token_123');
        $response->assertNotFound();
    }

    public function test_dashboard_returns_trend_and_language_breakdown(): void
    {
        $user = User::factory()->create();
        PdfSummary::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'summary' => 'Test summary',
            'target_language' => 'uz',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('dailyTrend')
                ->has('languageBreakdown')
            );
    }

    public function test_weekly_digest_command_queues_emails(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        PdfSummary::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'summary' => 'Test summary',
            'target_language' => 'en',
            'created_at' => now()->subDays(2),
        ]);

        $this->artisan('digest:weekly')->assertExitCode(0);

        Mail::assertQueued(WeeklyDigestMail::class, function ($mail) use ($user) {
            return $mail->user->id === $user->id;
        });
    }

    public function test_user_can_rewrite_summary_with_ai(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/pdf/rewrite', [
            'summary' => 'Original complex text summary.',
            'mode' => 'simpler',
            'target_language' => 'en',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['summary', 'mode'])
            ->assertJson(['mode' => 'simpler']);
    }
}
