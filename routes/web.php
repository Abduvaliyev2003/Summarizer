<?php

use App\Http\Controllers\SubscriptionController;
use App\Models\Plan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $user = auth()->user();

    $userStats = null;

    if ($user) {
        $user->load('plan');

        $userStats = [
            'pdfCount' => $user->pdf_count ?? 0,
            'pdfLimit' => $user->plan->pdf_limit ?? 0,
            'canUpload' => $user->canSummarizePdf(),
        ];
    }

    return Inertia::render('Welcome', [
        'canRegister' => Route::has('register'),

        'plans' => \App\Models\Plan::where('is_active', true)
            ->orderBy('price')
            ->get(),

        'auth' => [
            'user' => $user,
        ],

        'userStats' => $userStats,
    ]);
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});


Route::get('/checkout/{plan_slug}', function ($plan_slug) {
    $plan = Plan::where('slug', $plan_slug)->where('is_active', true)->firstOrFail();
    return Inertia::render('checkout', [
        'plan' => $plan,
        'stripeKey' => config('services.stripe.key'),
    ]);
})->name('checkout');


Route::post('/subcription/create-payment-intent', [SubscriptionController::class, 'createPaymentIntent'])->name('subscription.create-payment-intent');
Route::post('/subcription/subscribe/{plan_slug}', [SubscriptionController::class, 'subscribe'])->name('subscription.subscribe');
Route::post('/subcription/create-checkout-session/{plan_slug}', [SubscriptionController::class, 'createCheckoutSession'])->name('subscription.create-checkout-session');
Route::get('/subcription/success', [SubscriptionController::class, 'success'])->name('subscription.success');
Route::post('/subcription/cancel', [SubscriptionController::class, 'cancel'])->name('subscription.cancel');
Route::post('/subcription/change-plan', [SubscriptionController::class, 'changePlan'])->name('subscription.change-plan');


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';