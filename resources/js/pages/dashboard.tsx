import { AdminAnalyticsCharts } from '@/components/dashboard/admin-analytics-charts';
import { UserAnalyticsChart } from '@/components/dashboard/user-analytics-chart';
import { CircularProgress } from '@/components/dashboard/circular-progress';
import { SectionCard } from '@/components/ui/section-card';
import { StatCard } from '@/components/ui/stat-card';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatPrice } from '@/lib/format';
import { AdminStats, BreadcrumbItem, PdfSummary, User, UserStats } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    History as HistoryIcon,
    Sparkles,
    Upload,
    UserCheck,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    user: User;
    userStats?: UserStats;
    dailyTrend?: Array<{ day: string; count: number }>;
    languageBreakdown?: Record<string, number>;
    recentSummaries?: PdfSummary[];
    adminStats?: AdminStats;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
];

function FlashToast({
    flash,
    onDismiss,
}: {
    flash: { success?: string; error?: string };
    onDismiss: () => void;
}) {
    const isSuccess = Boolean(flash.success);
    const message = flash.success || flash.error;

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-xl transition-all ${
                isSuccess
                    ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-200'
            }`}
        >
            <div className="flex items-center gap-3">
                {isSuccess ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                ) : (
                    <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                )}
                <p className="text-sm font-semibold">{message}</p>
            </div>
            <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Dismiss notification"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}

export default function Dashboard({ user, userStats, dailyTrend, recentSummaries, adminStats, flash }: Props) {
    const [dismissed, setDismissed] = useState(false);
    const isAdmin = user.role === 'admin';

    // Normalised stats
    const pdfCount = userStats?.pdfCount ?? 0;
    const pdfLimit = userStats?.pdfLimit ?? 0;
    const planName = userStats?.planName ?? 'No Plan';
    const totalSummaries = userStats?.totalSummaries ?? 0;

    const isUnlimited = pdfLimit < 0;
    const usagePercent =
        isUnlimited || pdfLimit === 0 ? 0 : Math.min(100, Math.round((pdfCount / pdfLimit) * 100));
    const isNearLimit = usagePercent >= 80 && !isUnlimited;

    const calculatedRevenue =
        adminStats?.monthlyRevenue ??
        (adminStats?.plans?.reduce((sum, plan) => sum + plan.price * (plan.active_subscribers_count ?? 0), 0) ?? 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - PDF Summarizer" />

            {flash && !dismissed && (flash.success || flash.error) && (
                <FlashToast flash={flash} onDismiss={() => setDismissed(true)} />
            )}

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {isAdmin ? 'Admin Command Center ⚡' : `Welcome back, ${user.name.split(' ')[0]} 👋`}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {isAdmin
                                ? 'Real-time overview of subscriptions, revenue, and platform activity.'
                                : "Here's a snapshot of your account and usage."}
                        </p>
                    </div>

                    {isAdmin && (
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Users className="h-4 w-4" />
                            Manage All Users
                        </Link>
                    )}
                </div>

                {isAdmin ? (
                    <>
                        {/* Admin Stat Cards */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                icon={DollarSign}
                                label="Est. Monthly Revenue"
                                value={formatPrice(calculatedRevenue)}
                                hint="Active subscriber monthly total"
                                accent="emerald"
                            />
                            <StatCard
                                icon={Users}
                                label="Total Users"
                                value={adminStats?.totalUsers ?? 0}
                                trend={adminStats?.userGrowthTrend}
                                hint={`${adminStats?.usersThisMonth ?? 0} new this month`}
                                accent="violet"
                            />
                            <StatCard
                                icon={UserCheck}
                                label="Active Subscriptions"
                                value={adminStats?.activeUsers ?? 0}
                                hint="Paid active members"
                                accent="indigo"
                            />
                            <StatCard
                                icon={FileText}
                                label="PDFs Processed"
                                value={adminStats?.totalPdfs ?? 0}
                                hint={`${adminStats?.pdfsThisMonth ?? 0} processed this month`}
                                accent="amber"
                            />
                        </div>

                        {/* Interactive Monthly Charts */}
                        {adminStats?.monthlyTrend && <AdminAnalyticsCharts trend={adminStats.monthlyTrend} />}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Plans Revenue Breakdown */}
                            <SectionCard className="p-6 lg:col-span-1">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Subscription Plans
                                    </h2>
                                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                                        {adminStats?.plans?.length ?? 0} Plans
                                    </span>
                                </div>

                                {!adminStats?.plans || adminStats.plans.length === 0 ? (
                                    <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                                        No plans available.
                                    </p>
                                ) : (
                                    <div className="mt-6 space-y-5">
                                        {adminStats.plans.map((plan) => {
                                            const activeSubscribers = plan.active_subscribers_count ?? 0;
                                            const share = Math.round((activeSubscribers / (adminStats.activeUsers || 1)) * 100);
                                            const planRevenue = plan.price * activeSubscribers;

                                            return (
                                                <div
                                                    key={plan.id}
                                                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/5"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {plan.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {formatPrice(plan.price)}/mo per user
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                {formatPrice(planRevenue)}
                                                            </p>
                                                            <p className="text-[11px] font-semibold text-slate-500">
                                                                {activeSubscribers} active ({share}%)
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
                                                            style={{ width: `${share}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </SectionCard>

                            {/* Recent Registered Users Table */}
                            <SectionCard className="p-6 lg:col-span-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Recent Registered Users
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Latest member sign-ups & document usage
                                        </p>
                                    </div>
                                    <Link
                                        href="/admin/users"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline dark:text-violet-400"
                                    >
                                        View all
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>

                                <div className="mt-6 overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                                                <th className="pb-3 font-semibold">User</th>
                                                <th className="pb-3 font-semibold">Plan</th>
                                                <th className="pb-3 font-semibold">PDF Usage</th>
                                                <th className="pb-3 font-semibold">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {adminStats?.recentUsers && adminStats.recentUsers.length > 0 ? (
                                                adminStats.recentUsers.map((u) => (
                                                    <tr key={u.id} className="group">
                                                        <td className="py-3">
                                                            <div className="font-bold text-slate-900 dark:text-white">
                                                                {u.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400">{u.email}</div>
                                                        </td>
                                                        <td className="py-3">
                                                            <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                                                                {u.plan?.name ?? 'Free'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 font-medium text-slate-600 dark:text-slate-300">
                                                            {u.pdf_count ?? 0} docs
                                                        </td>
                                                        <td className="py-3 text-slate-400">{formatDate(u.created_at)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-slate-400">
                                                        No users found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionCard>
                        </div>
                    </>
                ) : (
                    <>
                        {/* USAGE HERO CARD */}
                        <SectionCard
                            glow
                            className={`p-8 ${
                                isNearLimit
                                    ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5'
                                    : 'border-violet-100 bg-white/80 dark:border-white/10 dark:bg-white/5'
                            }`}
                        >
                            <CircularProgress
                                percent={usagePercent}
                                pdfCount={pdfCount}
                                pdfLimit={pdfLimit}
                                isUnlimited={isUnlimited}
                                isNearLimit={isNearLimit}
                            />

                            <div className="mt-6 text-center">
                                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                                    Current Plan: {planName}
                                </h2>
                                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {isUnlimited
                                        ? 'Enjoy unlimited PDF summaries.'
                                        : `${pdfCount} of ${pdfLimit} documents used this month.`}
                                </p>

                                {isNearLimit && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                        <span>You are running low on monthly document limit.</span>
                                        <Link
                                            href="/billing"
                                            className="font-bold underline transition-colors hover:text-amber-900 dark:hover:text-amber-300"
                                        >
                                            Upgrade plan
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        {/* Quick action grid */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <StatCard
                                icon={FileText}
                                label="Monthly PDF Usage"
                                value={isUnlimited ? `${pdfCount} / ∞` : `${pdfCount} / ${pdfLimit}`}
                                hint={isUnlimited ? 'Unlimited plan' : `${100 - usagePercent}% remaining`}
                                accent="violet"
                            />
                            <StatCard
                                icon={HistoryIcon}
                                label="Total Summaries"
                                value={totalSummaries}
                                hint="Processed with AI"
                                accent="indigo"
                            />
                            <StatCard
                                icon={Zap}
                                label="Active Plan"
                                value={planName}
                                hint={isUnlimited ? 'Full access' : 'Monthly subscription'}
                                accent="emerald"
                            />
                        </div>

                        {/* Interactive User Trend Chart */}
                        <UserAnalyticsChart dailyTrend={dailyTrend} />

                        {/* Recent Summaries Widget */}
                        <SectionCard className="p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Recent Summaries
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Quick access to your latest processed documents
                                    </p>
                                </div>
                                <Link
                                    href="/history"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3.5 py-2 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20"
                                >
                                    View all
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </div>

                            {!recentSummaries || recentSummaries.length === 0 ? (
                                <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                                        <Upload className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                        No summaries yet
                                    </h3>
                                    <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                                        Upload your first PDF document to get instant AI key takeaways.
                                    </p>
                                    <Link
                                        href="/"
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:scale-105"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                        Summarize PDF Now
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {recentSummaries.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-lg dark:border-white/5 dark:bg-white/5 dark:hover:border-violet-500/30"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                                    <FileText className="h-4 w-4 flex-none" />
                                                    <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                        {item.filename}
                                                    </h3>
                                                </div>
                                                <p className="mt-2 line-clamp-3 text-xs text-slate-500 dark:text-slate-400">
                                                    {item.summary}
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-white/5">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(item.created_at)}
                                                </span>
                                                <Link
                                                    href="/history"
                                                    className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
                                                >
                                                    Read
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
