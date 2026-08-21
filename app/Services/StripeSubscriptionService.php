<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\StripeWebhookEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Stripe\Checkout\Session;
use Stripe\Event;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Subscription;

class StripeSubscriptionService
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $secretKey = config('services.stripe.secret');
        if (empty($secretKey) && ! app()->environment('testing')) {
            throw new RuntimeException('Stripe is not configured.');
        }

        Stripe::setApiKey($secretKey ?: 'sk_test_mock');
        $this->stripe = new StripeClient($secretKey ?: 'sk_test_mock');
    }

    /**
     * Create a Stripe Checkout Session for subscription purchase.
     *
     * @return string Checkout session redirect URL
     */
    public function createCheckoutSession(User $user, Plan $plan): string
    {
        if ($user->stripe_subscription_id && (! $user->subscription_ends_at || $user->subscription_ends_at->isFuture())) {
            throw new RuntimeException('You already have an active subscription. Use billing to change or cancel it.', 409);
        }

        $customer = $user->stripe_customer_id ? ['customer' => $user->stripe_customer_id] : ['customer_email' => $user->email];

        $session = Session::create([
            'payment_method_types' => ['card'],
            ...$customer,
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
        $session = Session::retrieve($sessionId, ['expand' => ['subscription']]);

        if (
            (string) $session->client_reference_id !== (string) $user->id
            || (string) ($session->metadata->user_id ?? '') !== (string) $user->id
            || $session->status !== 'complete'
            || ! in_array($session->payment_status, ['paid', 'no_payment_required'], true)
        ) {
            throw new RuntimeException('The checkout session cannot be applied to this account.', 403);
        }

        $planId = $session->metadata->plan_id ?? null;
        $subscription = $session->subscription;
        if (! $subscription || ! is_object($subscription)) {
            throw new RuntimeException('The checkout session has no subscription.', 422);
        }

        $this->syncSubscription($user, $subscription, $planId ? (int) $planId : null);
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
            $subscription = $this->stripe->subscriptions->update($user->stripe_subscription_id, [
                'cancel_at_period_end' => true,
            ]);
        } catch (\Exception $e) {
            Log::warning('Stripe subscription cancellation failed: '.$e->getMessage());
            throw new RuntimeException('Unable to cancel the subscription. Please try again.', 502);
        }

        $this->syncSubscription($user, $subscription);
    }

    /**
     * Change user subscription to a new plan.
     */
    public function changePlan(User $user, Plan $newPlan): void
    {
        if (! $user->hasActiveSubscription() || ! $user->stripe_subscription_id || $newPlan->price <= 0) {
            throw new RuntimeException('An active paid subscription is required to change plans.', 403);
        }

        try {
            $subscription = $this->stripe->subscriptions->retrieve($user->stripe_subscription_id);
            $item = $subscription->items->data[0] ?? null;
            $product = $item?->price?->product ?? null;
            $productId = is_object($product) ? $product->id : $product;

            if (! $item || ! $productId) {
                throw new RuntimeException('The active Stripe subscription is missing a billable item.', 422);
            }

            $updatedSubscription = $this->stripe->subscriptions->update($user->stripe_subscription_id, [
                'items' => [[
                    'id' => $item->id,
                    'price_data' => [
                        'currency' => 'usd',
                        'product' => $productId,
                        'unit_amount' => (int) round($newPlan->price * 100),
                        'recurring' => ['interval' => 'month'],
                    ],
                ]],
                'payment_behavior' => 'error_if_incomplete',
                'proration_behavior' => 'create_prorations',
            ]);
        } catch (\Exception $e) {
            Log::warning('Stripe plan change failed: '.$e->getMessage());
            throw new RuntimeException('Unable to change the subscription plan. Please try again.', 502);
        }

        $this->syncSubscription($user, $updatedSubscription, $newPlan->id);
    }

    /**
     * Handle verified Stripe Webhook events.
     */
    public function handleWebhookEvent(Event $event): void
    {
        $webhookEvent = StripeWebhookEvent::firstOrCreate(
            ['stripe_event_id' => $event->id],
            ['type' => $event->type, 'payload' => $event->toArray()]
        );

        if ($webhookEvent->processed_at) {
            return;
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                /** @var Session $session */
                $session = $event->data->object;
                $userId = $session->metadata->user_id ?? null;
                if ($userId && (string) $session->payment_status === 'paid') {
                    $user = User::find($userId);
                    if ($user) {
                        $this->handleSuccess($user, $session->id);
                    }
                }
                break;

            case 'customer.subscription.updated':
                /** @var Subscription $subscription */
                $subscription = $event->data->object;
                $user = User::where('stripe_subscription_id', $subscription->id)->first();
                if ($user) {
                    $this->syncSubscription($user, $subscription);
                }
                break;

            case 'customer.subscription.deleted':
                /** @var Subscription $subscription */
                $subscription = $event->data->object;
                $user = User::where('stripe_subscription_id', $subscription->id)->first();
                if ($user) {
                    $freePlan = Plan::where('slug', 'free')->first();
                    $user->update([
                        'stripe_subscription_id' => null,
                        'stripe_subscription_status' => 'canceled',
                        'subscription_cancel_at_period_end' => false,
                        'plan_id' => $freePlan?->id ?? $user->plan_id,
                        'subscription_ends_at' => now(),
                    ]);
                }
                break;
        }

        $webhookEvent->update(['processed_at' => now()]);
    }

    private function syncSubscription(User $user, object $subscription, ?int $planId = null): void
    {
        $periodEnd = isset($subscription->current_period_end)
            ? Carbon::createFromTimestamp($subscription->current_period_end)
            : null;

        $user->update([
            'plan_id' => $planId ?? $user->plan_id,
            'stripe_customer_id' => $subscription->customer ?? $user->stripe_customer_id,
            'stripe_subscription_id' => $subscription->id ?? $user->stripe_subscription_id,
            'stripe_subscription_status' => $subscription->status ?? $user->stripe_subscription_status,
            'subscription_cancel_at_period_end' => (bool) ($subscription->cancel_at_period_end ?? false),
            'subscription_ends_at' => $periodEnd,
        ]);
    }
}
