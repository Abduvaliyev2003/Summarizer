<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PdfSummarizeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_summarize_pdf(): void
    {
        $this->postJson('/pdf/summarize', [])->assertUnauthorized();
    }

    public function test_user_cannot_submit_without_file_or_url(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/pdf/summarize', []);

        $response->assertStatus(422);
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

    public function test_user_cannot_submit_invalid_url(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/pdf/summarize', [
            'pdf_url' => 'not-a-valid-url',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_summarize_pdf_from_url_with_target_language(): void
    {
        Config::set('services.openrouter.key', 'mock-openrouter-key');

        $plan = Plan::factory()->create(['pdf_limit' => 10, 'is_active' => true]);
        $user = User::factory()->create(['plan_id' => $plan->id, 'pdf_count' => 0]);

        // Create dummy PDF bytes
        $pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n308\n%%EOF";

        Http::fake([
            'https://example.com/test.pdf' => Http::response($pdfContent, 200, ['Content-Type' => 'application/pdf']),
            'https://openrouter.ai/api/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => "Bu hujjatning o'zbekcha xulosasi.",
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($user)->postJson('/pdf/summarize', [
            'pdf_url' => 'https://example.com/test.pdf',
            'summary_type' => 'default',
            'target_language' => 'uz',
        ]);

        $response->assertOk();
        $response->assertJson([
            'summary' => "Bu hujjatning o'zbekcha xulosasi.",
            'targetLanguage' => 'uz',
            'pdfCount' => 1,
        ]);

        $this->assertDatabaseHas('pdf_summaries', [
            'user_id' => $user->id,
            'target_language' => 'uz',
            'source_url' => 'https://example.com/test.pdf',
        ]);
    }

    public function test_user_can_generate_student_study_suite_quiz(): void
    {
        Config::set('services.openrouter.key', 'mock-openrouter-key');

        $plan = Plan::factory()->create(['pdf_limit' => 10, 'is_active' => true]);
        $user = User::factory()->create(['plan_id' => $plan->id, 'pdf_count' => 0]);

        $pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Study Material) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n308\n%%EOF";

        $mockOutput = "=== KEY CONCEPTS ===\n1. Concept One\n\n=== EXAM QUIZ ===\nQuestion 1: What is concept one?\nA) Answer A\nB) Answer B\nC) Answer C\nD) Answer D\nCorrect Answer: A\n\n=== FLASHCARDS ===\nQ: What is concept one? | A: Answer A";

        Http::fake([
            'https://example.com/study.pdf' => Http::response($pdfContent, 200, ['Content-Type' => 'application/pdf']),
            'https://openrouter.ai/api/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => $mockOutput,
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($user)->postJson('/pdf/summarize', [
            'pdf_url' => 'https://example.com/study.pdf',
            'summary_type' => 'quiz',
            'target_language' => 'uz',
        ]);

        $response->assertOk();
        $response->assertJson([
            'summary' => $mockOutput,
            'targetLanguage' => 'uz',
        ]);
    }
}
