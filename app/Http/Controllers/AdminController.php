<?php

namespace App\Http\Controllers;

use App\Models\PdfSummary;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display a listing of all registered users for administration.
     */
    public function users(): Response
    {
        $users = User::with('plan')
            ->withCount('pdfSummaries')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $plans = Plan::where('is_active', true)->orderBy('price')->get();

        $stats = [
            'totalUsers' => User::count(),
            'activeSubscriptions' => User::whereNotNull('stripe_subscription_id')
                ->whereIn('stripe_subscription_status', ['active', 'trialing'])
                ->count(),
            'totalPdfsProcessed' => PdfSummary::count(),
        ];

        return Inertia::render('admin/users', [
            'users' => $users,
            'plans' => $plans,
            'stats' => $stats,
        ]);
    }

    /**
     * Update the plan for a specific user.
     */
    public function updateUserPlan(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
        ]);

        $user->update([
            'plan_id' => $validated['plan_id'],
            'pdf_count' => 0,
            'pdf_count_reset_at' => now()->addDays(30),
        ]);

        return back()->with('success', 'Plan updated successfully.');
    }
}
