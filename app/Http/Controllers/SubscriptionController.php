<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class SubscriptionController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function createPaymentIntent(Request $request)
    {
        Log::info('createPaymentIntent', ['request' => $request->all()]);
        
        $request->validate([
            'plan_slug' => 'required|string',
        ]);

        try {
            $plan = Plan::where('slug', $request->plan_slug)->where('is_active', true)->firstOrFail();
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
            $user = $request->user();

            if (!$user->stripe_customer_id)
            {
                $customer = $stripe->customers->create([
                    'name' => $user->name,
                    'email' => $user->email,
                    'metadata' => [
                        'user_id' => $user->id,
                    ],
                ]);
                $user->update([
                    'stripe_customer_id' => $customer->id,
                ]);
            } else {
                $customer = $stripe->customers->retrieve($user->stripe_customer_id);
            }

            $amount = (int) round((float) ($request->input('amount') ?: $plan->price * 100));

            $paymentIntent = $stripe->paymentIntents->create([
                'amount' => $amount,
                'currency' => 'usd',
                'customer' => $customer->id,
                'payment_method_types' => ['card'],
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_slug' => $request->plan_slug,
                ],
            ]);

            return  response()->json([
                'clientSecret' => $paymentIntent->client_secret,
            ]);
        } catch (\Exception $e) {
            Log::error('createPaymentIntent', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }

    }

    public function subscribe(Request $request, $slug)
    {
        Log::info('subscribe', ['request' => $request->all()]);

        $request->validate([
            'stripeToken' => 'required|string',
        ]);
        $plan = Plan::where('slug', $slug)->where('is_active', true)->firstOrFail();
        $user = $request->user();

        Log::info('plan:', $plan->toArray());

        try {
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
            
            if(!$user->stripe_customer_id)
            {
                $customer = $stripe->customers->create([
                    'name' => $user->name,
                    'email' => $user->email,
                    'source' => $request->stripeToken,
                    'metadata' => [
                        'user_id' => $user->id,
                    ],
                ]);
                $user->update([
                    'stripe_customer_id' => $customer->id,
                ]);
            } else {
                $customer = $stripe->customers->retrieve($user->stripe_customer_id);

                $stripe->customers->update($customer->id, [
                    'source' => $request->stripeToken,
                ]);
            }

            $price  = $stripe->prices->create([
                'currency' => 'usd',
                'unit_amount' => $plan->price * 100,
                'recurring' => [
                    'interval' => 'month',
                ],
                'product_data' => [
                    'name' => $plan->name,
                    'description' => $plan->description,
                ],
            ]);
            
            $subscription = $stripe->subscriptions->create([
                'customer' => $customer->id,
                'items' => [
                    [
                        'price' => $price->id,
                    ],
                ],
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                ],
            ]);
            
            $user->update([
                'plan_id' => $plan->id,
                'stripe_subscription_id' => $subscription->id,
                'pdf_count' => 0,
                'pdf_count_reset_at' => now()->addDays(30),
                'subscription_ends_at' => now()->addMonths(),
            ]);
            
            return redicrect()->route('dashboard')->with('success', 'You have successfully subscribed to the plan.');

        } catch (\Stripe\Exception\CardException $e) {
            Log::error('subscribe', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', $e->getError()->message);
        } catch (\Exception $e) {
            Log::error('subscribe', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public  function createCheckoutSession(Request $request)
    {   
        Log::info('createCheckoutSession', ['request' => $request->all()]);
        $plan = Plan::where('slug', $request->plan_slug)->where('is_active', true)->firstOrFail();
        $user = $request->user();
        
        try{
            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [
                    [
                        'price_data' => [
                            'currency' => 'usd',
                            'unit_amount' => $plan->price * 100,
                            'product_data' => [
                                'name' => $plan->name,
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
                'success_url' => route('checkout.success') . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('checkout', ['plan_slug' => $plan->slug]),
                'customer_email' => $user->email,
                'client_reference_id' => $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                ],
            ]);
            return Inertia::location($session->url);
        
        } catch (\Exception $e) {
            Log::error('createCheckoutSession', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function success(Request $request)
    {
        Log::info('success', ['request' => $request->all()]);
        $sessionId =  $request->get('session_id') ?? $request->session_id;

        if(!$sessionId)
        {
            return redirect()->route('dashboard')->with('error', 'Something went wrong.');
        }

        try {
            $session = Session::retrieve($sessionId);
            $user = $request->user();

            $user->update([
                'plan_id' => $session->metadata->plan_id,
                'stripe_subscription_id' => $session->customer,
                'pdf_count' => 0,
                'pdf_count_reset_at' => now()->addDays(30),
                'subscription_ends_at' => now()->addMonths(),
            ]);

            return redirect()->route('dashboard')->with('success', 'You have successfully subscribed to the plan.');
        

        }
        catch (\Exception $e) {
            Log::error('success', ['error' => $e->getMessage()]);
            return redirect()->route('dashboard')->with('error' , 'Failed to active subscription.');
        }
       
    }

    public function cancel(Request $request)
    {
        Log::info('cancel', ['request' => $request->all()]);
        $user = $request->user();
        
        if(!$user->stripe_subscription_id)
        {
            return redirect()->route('dashboard')->with('error', 'Something went wrong.');
        }

        try {
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
            $stripe->subscriptions->cancel($user->stripe_subscription_id);
            $user->update([
                'subscription_ends_at' => now()->addDays(30),
                
            ]);
            return back()->with('success', 'You have successfully canceled your subscription.');
        } catch (\Exception $e) {
            Log::error('cancel', ['error' => $e->getMessage()]);
            return back()->with('error', 'Something went wrong.');
        }
    }

    public function changePlan(Request $request)
    {
        Log::info('changePlan', ['request' => $request->all()]);
        $request->validate([
            'plan_slug' => 'required|exists:plans,slug',
        ]);
        $user = $request->user();
        $newplan = Plan::where('slug', $request->plan_slug)->where('is_active', true)->firstOrFail();

        if(!$user->stripe_subscription_id)
        {
            return redirect()->route('dashboard')->with('error', 'No active subscription found.');
        }

        try {
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
            $stripe->subscriptions->update($user->stripe_subscription_id, [
                'items' => [
                    [
                        'id' => $user->stripe_subscription_id,
                        'price_data' => [
                            'currency' => 'usd',
                            'unit_amount' => $newplan->price * 100,
                            'product_data' => [
                                'name' => $newplan->name . ' Plan',
                                'description' => $newplan->description,
                            ],
                            'recurring' => [
                                'interval' => 'month',
                            ],
                        ],
                    ],
                ],
                'proration_behavior' => 'create_prorations',
            ]);
            $user->update([
                'plan_id' => $newplan->id,
                'pdf_count' => 0,
                'pdf_count_reset_at' => now()->addDays(30),
                'subscription_ends_at' => now()->addMonths(),
            ]);
            return back()->with('success', 'You have successfully changed your plan.');
        } catch (\Exception $e) {
            Log::error('changePlan', ['error' => $e->getMessage()]);
            return back()->with('error', 'Something went wrong.');
        }
        
        
    }

}
