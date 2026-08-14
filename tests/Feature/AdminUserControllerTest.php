<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_users(): void
    {
        $this->get('/admin/users')->assertRedirect('/login');
    }

    public function test_non_admin_user_is_forbidden_from_admin_users(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user)->get('/admin/users')->assertStatus(403);
    }

    public function test_admin_can_access_admin_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->get('/admin/users')->assertOk();
    }

    public function test_non_admin_cannot_update_user_plan(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $targetUser = User::factory()->create();
        $plan = Plan::factory()->create(['is_active' => true]);

        $this->actingAs($user)
            ->post("/admin/users/{$targetUser->id}/plan", ['plan_id' => $plan->id])
            ->assertStatus(403);
    }

    public function test_admin_can_update_user_plan(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $targetUser = User::factory()->create();
        $plan = Plan::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin)
            ->post("/admin/users/{$targetUser->id}/plan", ['plan_id' => $plan->id]);

        $response->assertRedirect();
        $this->assertEquals($plan->id, $targetUser->fresh()->plan_id);
    }
}
