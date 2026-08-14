<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_create_checkout_session(): void
    {
        $plan = Plan::factory()->create(['slug' => 'pro-plan', 'is_active' => true]);

        $this->postJson("/subscription/create-checkout-session/{$plan->slug}")
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_request_checkout_session(): void
    {
        $plan = Plan::factory()->create(['slug' => 'pro-plan', 'price' => 19, 'is_active' => true]);
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson("/subscription/create-checkout-session/{$plan->slug}");

        $response->assertOk();
        $response->assertJsonStructure(['url']);
    }

    public function test_cancel_subscription_without_subscription_id_returns_error(): void
    {
        $user = User::factory()->create(['stripe_subscription_id' => null]);

        $response = $this->actingAs($user)->post('/subscription/cancel');

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_cancel_subscription_with_subscription_id_succeeds(): void
    {
        $user = User::factory()->create(['stripe_subscription_id' => 'sub_mock123']);

        $response = $this->actingAs($user)->post('/subscription/cancel');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_change_plan_updates_user_plan(): void
    {
        $user = User::factory()->create(['stripe_subscription_id' => 'sub_mock123']);
        $newPlan = Plan::factory()->create(['slug' => 'enterprise-plan', 'is_active' => true]);

        $response = $this->actingAs($user)->post('/subscription/change-plan', [
            'plan_slug' => $newPlan->slug,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($newPlan->id, $user->fresh()->plan_id);
    }
}
