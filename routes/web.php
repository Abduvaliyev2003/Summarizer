<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PDFSummarizeController;
use App\Http\Controllers\PdfSummaryController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Public landing & checkout routes
Route::get('/', WelcomeController::class)->name('home');
Route::get('/checkout/{plan_slug}', CheckoutController::class)->name('checkout');

// Authenticated user workspace routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/billing', BillingController::class)->name('billing');
    Route::get('/history', [PdfSummaryController::class, 'index'])->name('history');

    // PDF Summarization endpoint
    Route::post('/pdf/summarize', [PDFSummarizeController::class, 'summarize'])->name('pdf.summarize');

    // Subscription management routes
    Route::prefix('subscription')->as('subscription.')->group(function () {
        Route::post('/create-payment-intent', [SubscriptionController::class, 'createPaymentIntent'])->name('create-payment-intent');
        Route::post('/subscribe/{plan_slug}', [SubscriptionController::class, 'subscribe'])->name('subscribe');
        Route::post('/create-checkout-session/{plan_slug}', [SubscriptionController::class, 'createCheckoutSession'])->name('create-checkout-session');
        Route::get('/success', [SubscriptionController::class, 'success'])->name('success');
        Route::post('/cancel', [SubscriptionController::class, 'cancel'])->name('cancel');
        Route::post('/change-plan', [SubscriptionController::class, 'changePlan'])->name('change-plan');
    });
});

// Admin administration routes (protected by auth & admin middleware)
Route::middleware(['auth', 'admin'])->prefix('admin')->as('admin.')->group(function () {
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::post('/users/{user}/plan', [AdminController::class, 'updateUserPlan'])->name('update-user-plan');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
