<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WelcomeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_visit_home_page(): void
    {
        $response = $this->get('/');

        $response->assertOk();
    }

    public function test_authenticated_user_can_visit_home_page_with_stats(): void
    {
        $plan = Plan::factory()->create(['pdf_limit' => 10, 'is_active' => true]);
        $user = User::factory()->create(['plan_id' => $plan->id, 'pdf_count' => 3]);

        $response = $this->actingAs($user)->get('/');

        $response->assertOk();
    }
}
