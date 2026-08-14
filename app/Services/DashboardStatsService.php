<?php

namespace App\Services;

use App\Models\PdfSummary;
use App\Models\Plan;
use App\Models\User;

class DashboardStatsService
{
    /**
     * Get statistics and trend data for the admin dashboard.
     *
     * @return array<string, mixed>
     */
    public function getAdminDashboardData(): array
    {
        $plans = Plan::withCount('users')->get();
        $totalUsers = User::count();
        $activeUsers = User::whereNotNull('stripe_subscription_id')->count();
        $totalPdfs = PdfSummary::count();

        $monthlyRevenue = $plans->reduce(function ($sum, $plan) {
            return $sum + ($plan->price * $plan->users_count);
        }, 0);

        $now = now();
        $usersThisMonth = User::where('created_at', '>=', $now->copy()->startOfMonth())->count();
        $usersLastMonth = User::whereBetween('created_at', [
            $now->copy()->subMonth()->startOfMonth(),
            $now->copy()->subMonth()->endOfMonth(),
        ])->count();

        $userGrowthTrend = $usersLastMonth > 0
            ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100, 1)
            : ($usersThisMonth > 0 ? 100 : 0);

        $pdfsThisMonth = PdfSummary::where('created_at', '>=', $now->copy()->startOfMonth())->count();

        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = $now->copy()->subMonths($i);
            $monthName = $monthDate->format('M');
            $start = $monthDate->copy()->startOfMonth();
            $end = $monthDate->copy()->endOfMonth();

            $monthlyTrend[] = [
                'month' => $monthName,
                'users' => User::whereBetween('created_at', [$start, $end])->count(),
                'pdfs' => PdfSummary::whereBetween('created_at', [$start, $end])->count(),
            ];
        }

        $recentUsers = User::with('plan:id,name,slug')
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'email', 'plan_id', 'pdf_count', 'created_at']);

        return [
            'adminStats' => [
                'totalUsers' => $totalUsers,
                'activeUsers' => $activeUsers,
                'totalPdfs' => $totalPdfs,
                'monthlyRevenue' => $monthlyRevenue,
                'usersThisMonth' => $usersThisMonth,
                'pdfsThisMonth' => $pdfsThisMonth,
                'userGrowthTrend' => $userGrowthTrend,
                'plans' => $plans,
                'monthlyTrend' => $monthlyTrend,
                'recentUsers' => $recentUsers,
            ],
        ];
    }

    /**
     * Get statistics and recent activity data for a regular user dashboard.
     *
     * @return array<string, mixed>
     */
    public function getUserDashboardData(User $user): array
    {
        $user->load('plan');

        $now = now();
        $dailyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i);
            $dailyTrend[] = [
                'day' => $day->format('D'),
                'count' => $user->pdfSummaries()
                    ->whereDate('created_at', $day->toDateString())
                    ->count(),
            ];
        }

        $languageBreakdown = $user->pdfSummaries()
            ->selectRaw('target_language, count(*) as total')
            ->groupBy('target_language')
            ->pluck('total', 'target_language')
            ->toArray();

        return [
            'userStats' => [
                'pdfCount' => $user->pdf_count ?? 0,
                'pdfLimit' => $user->plan?->pdf_limit ?? 0,
                'planName' => $user->plan?->name ?? 'No Plan',
                'totalSummaries' => $user->pdfSummaries()->count(),
            ],
            'dailyTrend' => $dailyTrend,
            'languageBreakdown' => $languageBreakdown,
            'recentSummaries' => $user->pdfSummaries()
                ->latest()
                ->limit(3)
                ->get(['id', 'filename', 'summary', 'created_at']),
        ];
    }
}
