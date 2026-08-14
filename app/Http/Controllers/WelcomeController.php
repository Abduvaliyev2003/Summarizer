<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Display the welcome landing page with active plans and user stats.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
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
            'plans' => Plan::where('is_active', true)->orderBy('price')->get(),
            'auth' => [
                'user' => $user,
            ],
            'userStats' => $userStats,
        ]);
    }
}
