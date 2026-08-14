<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    /**
     * Display the checkout page for a specific plan.
     */
    public function __invoke(Request $request, string $plan_slug): Response
    {
        $plan = Plan::where('slug', $plan_slug)->where('is_active', true)->firstOrFail();

        return Inertia::render('checkout', [
            'plan' => $plan,
            'stripeKey' => config('services.stripe.key'),
        ]);
    }
}
