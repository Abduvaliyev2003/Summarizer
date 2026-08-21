<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\StripeSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class SubscriptionController extends Controller
{
    public function __construct(protected StripeSubscriptionService $stripeService) {}

    /**
     * Create a Stripe Checkout Session for subscription purchase.
     */
    public function createCheckoutSession(Request $request, string $plan_slug): JsonResponse|SymfonyResponse|RedirectResponse
    {
        try {
            $plan = Plan::where('slug', $plan_slug)->where('is_active', true)->firstOrFail();
            $user = $request->user();

            $checkoutUrl = $this->stripeService->createCheckoutSession($user, $plan);

            if ($request->wantsJson() || $request->ajax() || $request->expectsJson()) {
                return response()->json(['url' => $checkoutUrl]);
            }

            return Inertia::location($checkoutUrl);
        } catch (\Exception $e) {
            Log::error('createCheckoutSession error: '.$e->getMessage());

            if ($request->wantsJson() || $request->ajax() || $request->expectsJson()) {
                return response()->json(['error' => 'Unable to start checkout. Please try again.'], 500);
            }

            return redirect()->back()->with('error', 'Unable to start checkout. Please try again.');
        }
    }

    /**
     * Legacy subscribe endpoint handler.
     */
    public function subscribe(Request $request, string $plan_slug): JsonResponse|SymfonyResponse|RedirectResponse
    {
        return $this->createCheckoutSession($request, $plan_slug);
    }

    /**
     * Handle Stripe Checkout successful redirect.
     */
    public function success(Request $request): RedirectResponse
    {
        $sessionId = $request->get('session_id') ?? $request->input('session_id');

        if (! $sessionId) {
            return redirect()->route('dashboard')->with('error', 'Something went wrong.');
        }

        try {
            $user = $request->user();
            $this->stripeService->handleSuccess($user, $sessionId);

            return redirect()->route('dashboard')->with('success', 'You have successfully subscribed to the plan.');
        } catch (\Exception $e) {
            Log::error('Subscription success callback error: '.$e->getMessage());

            return redirect()->route('dashboard')->with('error', 'Failed to activate subscription.');
        }
    }

    /**
     * Cancel an active user subscription.
     */
    public function cancel(Request $request): RedirectResponse
    {
        try {
            $user = $request->user();
            $this->stripeService->cancelSubscription($user);

            return back()->with('success', 'You have successfully canceled your subscription.');
        } catch (\Exception $e) {
            Log::error('Subscription cancel error: '.$e->getMessage());

            return back()->with('error', 'Unable to cancel the subscription. Please try again.');
        }
    }

    /**
     * Change user subscription to another plan.
     */
    public function changePlan(Request $request): RedirectResponse
    {
        $request->validate([
            'plan_slug' => ['required', 'exists:plans,slug'],
        ]);

        try {
            $user = $request->user();
            $newPlan = Plan::where('slug', $request->plan_slug)->where('is_active', true)->firstOrFail();

            $this->stripeService->changePlan($user, $newPlan);

            return back()->with('success', 'You have successfully changed your plan.');
        } catch (\Exception $e) {
            Log::error('Subscription changePlan error: '.$e->getMessage());

            return back()->with('error', 'Unable to change the subscription plan. Please try again.');
        }
    }
}
