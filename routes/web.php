<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentCollectionController;
use App\Http\Controllers\PDFSummarizeController;
use App\Http\Controllers\PdfSummaryController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\StripeWebhookController;
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

// Public Stripe Webhook Endpoint (CSRF Exempted)
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook'])->name('stripe.webhook');

// Public shared summary view
Route::get('/s/{token}', [ShareController::class, 'show'])->name('share.show');

// Authenticated user workspace routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/billing', BillingController::class)->name('billing');
    Route::get('/history', [PdfSummaryController::class, 'index'])->name('history');
    Route::get('/workspaces', [DocumentCollectionController::class, 'index'])->name('workspaces.index');
    Route::post('/workspaces', [DocumentCollectionController::class, 'store'])->name('workspaces.store');
    Route::post('/workspaces/summaries/{summary}', [DocumentCollectionController::class, 'assign'])->name('workspaces.assign');
    Route::post('/workspaces/{collection}/chat', [DocumentCollectionController::class, 'chat'])->middleware('throttle:15,1')->name('workspaces.chat');
    Route::post('/history/{summary}/share', [ShareController::class, 'toggle'])->name('share.toggle');

    // PDF Summarization endpoint (rate limited to 10 requests per minute)
    Route::post('/pdf/summarize', [PDFSummarizeController::class, 'summarize'])
        ->middleware('throttle:10,1')
        ->name('pdf.summarize');

    // Multi-PDF Comparison endpoint
    Route::post('/pdf/compare', [PDFSummarizeController::class, 'compare'])
        ->middleware('throttle:10,1')
        ->name('pdf.compare');

    // AI Rewrite & Improve endpoint
    Route::post('/pdf/rewrite', [PDFSummarizeController::class, 'rewrite'])
        ->middleware('throttle:10,1')
        ->name('pdf.rewrite');

    // Chat with PDF Q&A endpoint
    Route::post('/pdf/chat', [PDFSummarizeController::class, 'chat'])
        ->middleware('throttle:15,1')
        ->name('pdf.chat');

    // Async PDF Summary Status Polling endpoint
    Route::get('/pdf/status/{summary}', [PDFSummarizeController::class, 'status'])
        ->name('pdf.status');

    // Subscription management routes (rate limited to 20 requests per minute)
    Route::prefix('subscription')->middleware('throttle:20,1')->as('subscription.')->group(function () {
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
