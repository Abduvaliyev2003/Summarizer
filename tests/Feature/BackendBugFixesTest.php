<?php

namespace Tests\Feature;

use App\Models\PdfSummary;
use App\Models\Plan;
use App\Models\User;
use App\Services\StripeSubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackendBugFixesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_rewrite_another_users_summary_id(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $summaryB = PdfSummary::create([
            'user_id' => $userB->id,
            'filename' => 'secret.pdf',
            'summary' => 'Original content for user B',
            'target_language' => 'en',
            'file_size' => 1024,
        ]);

        $response = $this->actingAs($userA)->postJson(route('pdf.rewrite'), [
            'summary' => 'Attempting rewrite',
            'mode' => 'simpler',
            'target_language' => 'en',
            'summary_id' => $summaryB->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['summary_id']);

        $this->assertDatabaseHas('pdf_summaries', [
            'id' => $summaryB->id,
            'summary' => 'Original content for user B',
        ]);
    }

    public function test_user_can_rewrite_their_own_summary_id(): void
    {
        $user = User::factory()->create();

        $summary = PdfSummary::create([
            'user_id' => $user->id,
            'filename' => 'doc.pdf',
            'summary' => 'Original text',
            'target_language' => 'en',
            'file_size' => 512,
        ]);

        $response = $this->actingAs($user)->postJson(route('pdf.rewrite'), [
            'summary' => 'New simplified text',
            'mode' => 'simpler',
            'target_language' => 'en',
            'summary_id' => $summary->id,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('pdf_summaries', [
            'id' => $summary->id,
        ]);
    }

    public function test_can_summarize_pdf_auto_assigns_free_plan_when_missing(): void
    {
        $freePlan = Plan::create([
            'name' => 'Free',
            'slug' => 'free',
            'price' => 0,
            'pdf_limit' => 5,
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'plan_id' => null,
        ]);

        $this->assertTrue($user->canSummarizePdf());
        $this->assertEquals($freePlan->id, $user->fresh()->plan_id);
    }

    public function test_user_without_stripe_subscription_can_change_plan(): void
    {
        $oldPlan = Plan::create([
            'name' => 'Free',
            'slug' => 'free',
            'price' => 0,
            'pdf_limit' => 5,
            'is_active' => true,
        ]);

        $newPlan = Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'price' => 19,
            'pdf_limit' => 100,
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'plan_id' => $oldPlan->id,
            'stripe_subscription_id' => null,
        ]);

        $service = app(StripeSubscriptionService::class);
        $service->changePlan($user, $newPlan);

        $this->assertEquals($newPlan->id, $user->fresh()->plan_id);
    }

    public function test_user_can_translate_summary_via_rewrite_endpoint(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('pdf.rewrite'), [
            'summary' => 'This is a sample document summary.',
            'mode' => 'translate',
            'target_language' => 'uz',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['summary']);
    }
}
