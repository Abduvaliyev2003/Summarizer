<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_user_can_visit_the_dashboard(): void
    {
        $plan = Plan::factory()->create(['is_active' => true]);
        $user = User::factory()->create(['plan_id' => $plan->id, 'role' => 'user']);

        $this->actingAs($user)->get('/dashboard')->assertOk();
    }

    public function test_admin_user_can_visit_the_dashboard_with_admin_stats(): void
    {
        $plan = Plan::factory()->create(['is_active' => true]);
        $admin = User::factory()->create(['plan_id' => $plan->id, 'role' => 'admin']);

        $this->actingAs($admin)->get('/dashboard')->assertOk();
    }
}
