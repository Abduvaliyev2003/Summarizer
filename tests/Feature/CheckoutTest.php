<?php

namespace Tests\Feature;

use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render_checkout_page_for_valid_plan(): void
    {
        $plan = Plan::factory()->create(['slug' => 'pro-plan', 'is_active' => true]);

        $response = $this->get('/checkout/pro-plan');

        $response->assertOk();
    }

    public function test_checkout_page_returns_404_for_invalid_plan(): void
    {
        $response = $this->get('/checkout/non-existent-plan');

        $response->assertNotFound();
    }
}
