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

    public function test_cancel_subscription_with_an_invalid_subscription_id_does_not_report_success(): void
    {
        $user = User::factory()->create(['stripe_subscription_id' => 'sub_mock123']);

        $response = $this->actingAs($user)->post('/subscription/cancel');

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_user_without_an_active_subscription_cannot_change_to_a_paid_plan(): void
    {
        $currentPlan = Plan::factory()->create(['price' => 0]);
        $user = User::factory()->create(['plan_id' => $currentPlan->id]);
        $newPlan = Plan::factory()->create(['slug' => 'enterprise-plan', 'is_active' => true]);

        $response = $this->actingAs($user)->post('/subscription/change-plan', [
            'plan_slug' => $newPlan->slug,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertEquals($currentPlan->id, $user->fresh()->plan_id);
    }

    public function test_payment_intent_endpoint_is_not_exposed(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/subscription/create-payment-intent', ['amount' => 1])
            ->assertNotFound();
    }
}
