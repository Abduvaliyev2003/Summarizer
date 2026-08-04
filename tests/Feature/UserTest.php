<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_allows_creating_users_without_stripe_details(): void
    {
        $user = User::factory()->create();

        $this->assertNull($user->stripe_customer_id);
        $this->assertNull($user->stripe_subscription_id);
        $this->assertNull($user->subscription_ends_at);
    }
}
