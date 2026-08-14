<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PdfSummaryController extends Controller
{
    /**
     * Display a listing of user PDF summaries (history page).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $summaries = $user->pdfSummaries()->latest()->paginate(10);

        return Inertia::render('history', [
            'summaries' => $summaries,
        ]);
    }
}
