<?php

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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';