<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_billing(): void
    {
        $this->get('/billing')->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_billing_page(): void
    {
        $plan = Plan::factory()->create(['is_active' => true]);
        $user = User::factory()->create(['plan_id' => $plan->id]);

        $response = $this->actingAs($user)->get('/billing');

        $response->assertOk();
    }
}
