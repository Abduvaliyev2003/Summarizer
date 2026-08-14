<?php

namespace Tests\Feature;

use App\Models\PdfSummary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PdfHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_history(): void
    {
        $this->get('/history')->assertRedirect('/login');
    }

    public function test_user_can_view_their_pdf_summary_history(): void
    {
        $user = User::factory()->create();
        PdfSummary::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get('/history');

        $response->assertOk();
    }
}
