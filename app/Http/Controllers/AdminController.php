<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function users()
    {
        $users = User::with('plan')
            ->withCount('pdfSummaries')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('admin/users', [
            'users' => $users,
        ]);
    }

    public function updateUserPlan(Request $request, User $user)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);
        $user->update([
            'plan_id' => $request->plan_id,
            'pdf_count' => 0,
            'pdf_count_reset_at' => now()->addDays(30),
        ]);

        return back()->with('success', 'Plan updated successfully.');
    }
}
