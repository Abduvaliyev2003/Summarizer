<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class PdfSummarizeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_summarize_pdf(): void
    {
        $this->postJson('/pdf/summarize', [])->assertUnauthorized();
    }

    public function test_user_at_limit_cannot_summarize_pdf(): void
    {
        $plan = Plan::factory()->create(['pdf_limit' => 2, 'is_active' => true]);
        $user = User::factory()->create(['plan_id' => $plan->id, 'pdf_count' => 2]);

        $file = UploadedFile::fake()->create('sample.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user)->postJson('/pdf/summarize', [
            'pdf' => $file,
        ]);

        $response->assertStatus(403);
    }
}
