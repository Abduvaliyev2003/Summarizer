<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    /**
     * Display the user billing and subscription overview page.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user()->load('plan');

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
    }
}
