<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\PDFSummarizeController;
use App\Http\Controllers\SubscriptionController;
use App\Models\PdfSummary;
use App\Models\Plan;
use App\Models\User;
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

        'plans' => Plan::where('is_active', true)
            ->orderBy('price')
            ->get(),

        'auth' => [
            'user' => $user,
        ],

        'userStats' => $userStats,
    ]);
})->name('home');

Route::get('dashboard', function () {
    $user = auth()->user();

    $data = [
        'user' => $user->load('plan'),
    ];

    if ($user->isAdmin()) {
        $data['adminStats'] = [
            'totalUsers' => User::count(),
            'activeUsers' => User::whereNotNull('stripe_subscription_id')->count(),
            'totalPdfs' => PdfSummary::count(),
            'plans' => Plan::withCount('users')->get(),
        ];
    } else {
        $data['userStats'] = [
            'pdfCount' => $user->pdf_count ?? 0,
            'pdfLimit' => $user->plan?->pdf_limit ?? 0,
            'planName' => $user->plan?->name ?? 'No Plan',
            'totalSummaries' => $user->pdfSummaries()->count(),
        ];

        $data['recentSummaries'] = $user->pdfSummaries()
            ->latest()
            ->limit(3)
            ->get(['id', 'filename', 'summary', 'created_at']);
    }

    return Inertia::render('dashboard', $data);
})->middleware('auth')->name('dashboard');

Route::get('/checkout/{plan_slug}', function ($plan_slug) {
    $plan = Plan::where('slug', $plan_slug)->where('is_active', true)->firstOrFail();

    return Inertia::render('checkout', [
        'plan' => $plan,
        'stripeKey' => config('services.stripe.key'),
    ]);
})->name('checkout');

Route::get('/billing', function () {
    $user = auth()->user()->load('plan');

    return Inertia::render('billing', [
        'auth' => [
            'user' => $user,
        ],
        'userStats' => [
            'pdfCount' => $user->pdf_count ?? 0,
            'pdfLimit' => $user->plan?->pdf_limit ?? 0,
            'planName' => $user->plan?->name ?? 'No Plan',
            'totalSummaries' => $user->pdfSummaries()->count(),
        ],
    ]);
})->middleware('auth')->name('billing');

Route::get('/history', function () {
    $user = auth()->user();
    $summaries = $user->pdfSummaries()->latest()->paginate(10);

    return Inertia::render('history', [
        'summaries' => $summaries,
    ]);
})->middleware('auth')->name('history');

Route::post('/subscription/create-payment-intent', [SubscriptionController::class, 'createPaymentIntent'])->name('subscription.create-payment-intent');
Route::post('/subscription/subscribe/{plan_slug}', [SubscriptionController::class, 'subscribe'])->name('subscription.subscribe');
Route::post('/subscription/create-checkout-session/{plan_slug}', [SubscriptionController::class, 'createCheckoutSession'])->name('subscription.create-checkout-session');
Route::get('/subscription/success', [SubscriptionController::class, 'success'])->name('subscription.success');
Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel'])->name('subscription.cancel');
Route::post('/subscription/change-plan', [SubscriptionController::class, 'changePlan'])->name('subscription.change-plan');

Route::get('/admin/users', [AdminController::class, 'users'])->middleware('auth')->name('admin.users');
Route::post('/admin/users/{user}/plan', [AdminController::class, 'updateUserPlan'])->middleware('auth')->name('admin.update-user-plan');

Route::post('/pdf/summarize', [PDFSummarizeController::class, 'summarize'])->name('pdf.summarize');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
