<?php

namespace App\Http\Controllers;

use App\Services\DashboardStatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming dashboard request.
     */
    public function __invoke(Request $request, DashboardStatsService $statsService): Response
    {
        $user = $request->user();

        $data = [
            'user' => $user->load('plan'),
        ];

        if ($user->isAdmin()) {
            $data += $statsService->getAdminDashboardData();
        } else {
            $data += $statsService->getUserDashboardData($user);
        }

        return Inertia::render('dashboard', $data);
    }
}
