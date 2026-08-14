<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Stripe\Checkout\Session;
use Stripe\Stripe;
use Stripe\StripeClient;

class StripeSubscriptionService
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $secretKey = config('services.stripe.secret');
        Stripe::setApiKey($secretKey ?: 'sk_test_mock');
        $this->stripe = new StripeClient($secretKey ?: 'sk_test_mock');
    }

    /**
     * Create or retrieve a Stripe Customer for the given user.
     *
     * @return string Stripe Customer ID
     */
    public function ensureCustomer(User $user): string
    {
        if ($user->stripe_customer_id) {
            return $user->stripe_customer_id;
        }

        $customer = $this->stripe->customers->create([
            'name' => $user->name,
            'email' => $user->email,
            'metadata' => [
                'user_id' => (string) $user->id,
            ],
        ]);

        $user->update([
            'stripe_customer_id' => $customer->id,
        ]);

        return $customer->id;
    }

    /**
     * Create a Stripe PaymentIntent for inline payment handling.
     *
     * @return array{clientSecret: string}
     */
    public function createPaymentIntent(User $user, Plan $plan, ?int $customAmount = null): array
    {
        $customerId = $this->ensureCustomer($user);
        $amount = $customAmount ?: (int) round($plan->price * 100);

        $paymentIntent = $this->stripe->paymentIntents->create([
            'amount' => $amount,
            'currency' => 'usd',
            'customer' => $customerId,
            'payment_method_types' => ['card'],
            'metadata' => [
                'user_id' => (string) $user->id,
                'plan_slug' => $plan->slug,
            ],
        ]);

        return [
            'clientSecret' => $paymentIntent->client_secret,
        ];
    }

    /**
     * Create a Stripe Checkout Session for subscription purchase.
     *
     * @return string Checkout session redirect URL
     */
    public function createCheckoutSession(User $user, Plan $plan): string
    {
        $session = Session::create([
            'payment_method_types' => ['card'],
            'customer_email' => $user->email,
            'client_reference_id' => (string) $user->id,
            'line_items' => [
                [
                    'price_data' => [
                        'currency' => 'usd',
                        'unit_amount' => (int) round($plan->price * 100),
                        'product_data' => [
                            'name' => $plan->name.' Plan',
                            'description' => $plan->description,
                        ],
                        'recurring' => [
                            'interval' => 'month',
                        ],
                    ],
                    'quantity' => 1,
                ],
            ],
            'mode' => 'subscription',
            'success_url' => route('subscription.success').'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('checkout', ['plan_slug' => $plan->slug]),
            'metadata' => [
                'user_id' => (string) $user->id,
                'plan_id' => (string) $plan->id,
            ],
        ]);

        return $session->url;
    }

    /**
     * Process subscription success callback and update user account state.
     */
    public function handleSuccess(User $user, string $sessionId): void
    {
        $session = Session::retrieve($sessionId);

        $planId = $session->metadata->plan_id ?? null;
        $subscriptionId = $session->subscription ?? null;
        $customerId = $session->customer ?? null;

        $user->update([
            'plan_id' => $planId ?: $user->plan_id,
            'stripe_customer_id' => $customerId ?: $user->stripe_customer_id,
            'stripe_subscription_id' => $subscriptionId ?: $user->stripe_subscription_id,
            'pdf_count' => 0,
            'pdf_count_reset_at' => now()->addDays(30),
            'subscription_ends_at' => now()->addMonths(),
        ]);
    }

    /**
     * Cancel an active user subscription.
     */
    public function cancelSubscription(User $user): void
    {
        if (! $user->stripe_subscription_id) {
            throw new RuntimeException('No active subscription found.', 400);
        }

        try {
            $subscription = $this->stripe->subscriptions->retrieve($user->stripe_subscription_id);
            $this->stripe->subscriptions->cancel($user->stripe_subscription_id);
            $endsAt = isset($subscription->current_period_end)
                ? Carbon::createFromTimestamp($subscription->current_period_end)
                : now()->addDays(30);
        } catch (\Exception $e) {
            Log::warning('Stripe subscription cancel API call warning: '.$e->getMessage());
            $endsAt = now()->addDays(30);
        }

        $user->update([
            'subscription_ends_at' => $endsAt,
        ]);
    }

    /**
     * Change user subscription to a new plan.
     */
    public function changePlan(User $user, Plan $newPlan): void
    {
        if (! $user->stripe_subscription_id) {
            throw new RuntimeException('No active subscription found.', 400);
        }

        try {
            $subscription = $this->stripe->subscriptions->retrieve($user->stripe_subscription_id);
            $firstItemId = $subscription->items->data[0]->id ?? null;

            if ($firstItemId) {
                $this->stripe->subscriptions->update($user->stripe_subscription_id, [
                    'items' => [
                        [
                            'id' => $firstItemId,
                            'price_data' => [
                                'currency' => 'usd',
                                'unit_amount' => (int) round($newPlan->price * 100),
                                'product_data' => [
                                    'name' => $newPlan->name.' Plan',
                                    'description' => $newPlan->description,
                                ],
                                'recurring' => [
                                    'interval' => 'month',
                                ],
                            ],
                        ],
                    ],
                    'proration_behavior' => 'create_prorations',
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Stripe change plan API call warning: '.$e->getMessage());
        }

        $user->update([
            'plan_id' => $newPlan->id,
            'pdf_count' => 0,
            'pdf_count_reset_at' => now()->addDays(30),
            'subscription_ends_at' => now()->addMonths(),
        ]);
    }
}
