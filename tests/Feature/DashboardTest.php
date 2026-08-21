<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use App\Services\DashboardStatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

    public function test_admin_dashboard_counts_only_current_paid_subscriptions_for_revenue(): void
    {
        $freePlan = Plan::factory()->create(['price' => 0]);
        $paidPlan = Plan::factory()->create(['price' => 24.99]);

        User::factory()->create(['plan_id' => $freePlan->id]);
        User::factory()->create([
            'plan_id' => $paidPlan->id,
            'stripe_subscription_id' => 'sub_current',
            'subscription_ends_at' => now()->addMonth(),
        ]);
        User::factory()->create([
            'plan_id' => $paidPlan->id,
            'stripe_subscription_id' => 'sub_expired',
            'subscription_ends_at' => now()->subSecond(),
        ]);
        User::factory()->create(['plan_id' => $paidPlan->id]);

        Cache::forget('admin_dashboard_stats');
        $stats = app(DashboardStatsService::class)->getAdminDashboardData()['adminStats'];

        $this->assertSame(1, $stats['activeUsers']);
        $this->assertEquals(24.99, $stats['monthlyRevenue']);
        $this->assertSame(1, $stats['plans']->firstWhere('id', $paidPlan->id)->active_subscribers_count);
    }
}
