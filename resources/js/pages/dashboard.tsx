import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    History as HistoryIcon,
    Sparkles,
    TrendingUp,
    Upload,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    plan?: {
        id: number;
        name: string;
        pdf_limit: number;
    };
}

interface UserStats {
    pdfCount: number;
    pdfLimit: number;
    planName: string;
    totalSummaries: number;
}

interface RecentSummary {
    id: number;
    filename: string;
    summary: string;
    created_at: string;
}

interface AdminPlanBreakdown {
    id: number;
    name: string;
    slug: string;
    price: number;
    users_count: number;
}

interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalPdfs: number;
    plans: AdminPlanBreakdown[];
}

interface Props {
    user: User;
    userStats?: UserStats;
    recentSummaries?: RecentSummary[];
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

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/* -------------------------------------------------------------------------- */
/*  Circular Progress Ring                                                     */
/* -------------------------------------------------------------------------- */

function CircularProgress({
    percent,
    used,
    limit,
    planName,
    isNearLimit,
    isUnlimited,
}: {
    percent: number;
    used: number;
    limit: number;
    planName: string;
    isNearLimit: boolean;
    isUnlimited: boolean;
}) {
    const size = 160;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    const ringColor = isUnlimited
        ? 'url(#ringGradientUnlimited)'
        : isNearLimit
          ? 'url(#ringGradientAmber)'
          : 'url(#ringGradientViolet)';

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* SVG Ring */}
            <div className="relative flex-none" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <defs>
                        <linearGradient id="ringGradientViolet" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="50%" stopColor="#9333ea" />
                            <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="ringGradientAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                        <linearGradient id="ringGradientUnlimited" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                    </defs>
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        strokeWidth={strokeWidth}
                        className="stroke-violet-100 dark:stroke-white/10"
                    />
                    {/* Progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={isUnlimited ? 0 : offset}
                        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                    />
                </svg>

                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isUnlimited ? (
                        <Zap className="h-8 w-8 text-emerald-500" aria-hidden="true" />
                    ) : (
                        <>
                            <span
                                className={`text-3xl font-extrabold leading-none ${
                                    isNearLimit
                                        ? 'text-amber-500'
                                        : 'bg-gradient-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent'
                                }`}
                            >
                                {percent}%
                            </span>
                            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                used
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Text details */}
            <div className="flex flex-col gap-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Monthly usage
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
                        {isUnlimited ? (
                            <span className="text-emerald-500">Unlimited</span>
                        ) : (
                            <>
                                <span
                                    className={
                                        isNearLimit
                                            ? 'text-amber-500'
                                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'
                                    }
                                >
                                    {used}
                                </span>
                                <span className="text-xl font-semibold text-slate-400 dark:text-slate-500">
                                    {' '}
                                    / {limit}
                                </span>
                            </>
                        )}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {isUnlimited
                            ? 'No limits on your plan'
                            : `${Math.max(0, limit - used)} documents remaining this month`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            isUnlimited
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : isNearLimit
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        }`}
                    >
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {planName}
                    </span>

                    {isNearLimit && !isUnlimited && (
                        <Link
                            href="/billing"
                            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-violet-600/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:shadow-violet-600/30"
                        >
                            Upgrade
                            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Reusable pieces                                                            */
/* -------------------------------------------------------------------------- */

function StatCard({
    icon: Icon,
    label,
    value,
    hint,
    accent = 'violet',
}: {
    icon: typeof Users;
    label: string;
    value: ReactNode;
    hint?: string;
    accent?: 'violet' | 'emerald' | 'indigo' | 'amber';
}) {
    const accentStyles: Record<string, string> = {
        violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        amber: 'bg-amber-500/10 text-amber-500',
    };

    return (
        <div className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-900/10 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentStyles[accent]}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            {hint && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
    );
}

function QuickAction({
    icon: Icon,
    title,
    description,
    href,
}: {
    icon: typeof Upload;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-white/70 p-5 shadow-sm outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-900/10 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-500/30"
        >
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-violet-600/20">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>
            <ArrowUpRight
                className="h-4 w-4 flex-none text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-500"
                aria-hidden="true"
            />
        </Link>
    );
}

function FlashToast({ flash, onDismiss }: { flash: { success?: string; error?: string }; onDismiss: () => void }) {
    const message = flash.success ?? flash.error;
    const isSuccess = Boolean(flash.success);

    if (!message) return null;

    return (
        <div className="fixed top-4 right-4 z-50 w-full max-w-sm animate-[fadeIn_0.3s_ease-out]">
            <div
                role="alert"
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl ${
                    isSuccess
                        ? 'border-emerald-200 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'border-rose-200 bg-rose-50/95 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
                }`}
            >
                {isSuccess ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
                ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
                )}
                <p className="flex-1 text-sm font-medium leading-5">{message}</p>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss notification"
                    className="rounded-md p-0.5 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-current dark:hover:bg-white/10"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Dashboard({ user, userStats, recentSummaries, adminStats, flash }: Props) {
    const [dismissed, setDismissed] = useState(false);
    const isAdmin = user.role === 'admin';

    // Normalised stats — always defined so UI never hides behind undefined checks
    const pdfCount = userStats?.pdfCount ?? 0;
    const pdfLimit = userStats?.pdfLimit ?? 0;
    const planName = userStats?.planName ?? 'No Plan';
    const totalSummaries = userStats?.totalSummaries ?? 0;

    const isUnlimited = pdfLimit < 0;
    const usagePercent =
        isUnlimited || pdfLimit === 0 ? 0 : Math.min(100, Math.round((pdfCount / pdfLimit) * 100));
    const isNearLimit = usagePercent >= 80 && !isUnlimited;

    const totalMonthlyRevenue =
        adminStats?.plans?.reduce((sum, plan) => sum + plan.price * plan.users_count, 0) ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - PDF Summarizer" />

            {flash && !dismissed && (flash.success || flash.error) && (
                <FlashToast flash={flash} onDismiss={() => setDismissed(true)} />
            )}

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {isAdmin ? 'Admin overview' : `Welcome back, ${user.name.split(' ')[0]} 👋`}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {isAdmin
                            ? "Here's how your platform is performing today."
                            : "Here's a snapshot of your account and usage."}
                    </p>
                </div>

                {isAdmin ? (
                    <>
                        {/* Admin stat cards */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                icon={Users}
                                label="Total users"
                                value={adminStats?.totalUsers ?? 0}
                                accent="violet"
                            />
                            <StatCard
                                icon={CreditCard}
                                label="Active subscriptions"
                                value={adminStats?.activeUsers ?? 0}
                                accent="emerald"
                            />
                            <StatCard
                                icon={FileText}
                                label="PDFs processed"
                                value={adminStats?.totalPdfs ?? 0}
                                accent="indigo"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Est. monthly revenue"
                                value={new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                }).format(totalMonthlyRevenue)}
                                hint="Sum of active plan prices × subscribers"
                                accent="amber"
                            />
                        </div>

                        {/* Plans breakdown */}
                        <div className="rounded-3xl border border-violet-100 bg-white/80 p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Plans breakdown
                                </h2>
                                <Link
                                    href="/admin/users"
                                    className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-violet-600 outline-none transition-colors hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:text-violet-400"
                                >
                                    Manage users
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </div>

                            {!adminStats?.plans || adminStats.plans.length === 0 ? (
                                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                                    No active plans to show yet.
                                </p>
                            ) : (
                                <div className="mt-6 space-y-4">
                                    {adminStats.plans.map((plan) => {
                                        const share =
                                            adminStats.totalUsers > 0
                                                ? Math.round((plan.users_count / adminStats.totalUsers) * 100)
                                                : 0;

                                        return (
                                            <div key={plan.id}>
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {plan.name}
                                                        </span>
                                                        <span className="text-xs text-slate-400 dark:text-slate-500">
                                                            {new Intl.NumberFormat('en-US', {
                                                                style: 'currency',
                                                                currency: 'USD',
                                                            }).format(plan.price)}
                                                            /mo
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        {plan.users_count} subscriber
                                                        {plan.users_count === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-white/10">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 transition-all duration-500"
                                                        style={{ width: `${share}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* ---------------------------------------------------------- */}
                        {/* USAGE HERO CARD — always visible, circular ring              */}
                        {/* ---------------------------------------------------------- */}
                        <div
                            className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 ${
                                isNearLimit
                                    ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5'
                                    : 'border-violet-100 bg-white/80 dark:border-white/10 dark:bg-white/5'
                            }`}
                        >
                            {/* decorative glow */}
                            <div
                                className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-gradient-to-br from-violet-400/20 via-purple-400/10 to-transparent blur-2xl dark:from-violet-600/15"
                                aria-hidden="true"
                            />

                            <CircularProgress
                                percent={isUnlimited ? 100 : usagePercent}
                                used={pdfCount}
                                limit={pdfLimit}
                                planName={planName}
                                isNearLimit={isNearLimit}
                                isUnlimited={isUnlimited}
                            />
                        </div>

                        {/* User stat cards */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <StatCard
                                icon={FileText}
                                label="Total summaries"
                                value={totalSummaries}
                                accent="indigo"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Documents remaining"
                                value={isUnlimited ? '∞' : Math.max(0, pdfLimit - pdfCount)}
                                hint={isUnlimited ? 'Unlimited plan — no monthly cap' : `${pdfCount} of ${pdfLimit} used this month`}
                                accent={isNearLimit ? 'amber' : 'emerald'}
                            />
                        </div>

                        {/* Quick actions */}
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                                Quick actions
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <QuickAction
                                    icon={Upload}
                                    title="Summarize a PDF"
                                    description="Upload a new document"
                                    href="/"
                                />
                                <QuickAction
                                    icon={HistoryIcon}
                                    title="View history"
                                    description="See past summaries"
                                    href="/history"
                                />
                                <QuickAction
                                    icon={CreditCard}
                                    title="Manage billing"
                                    description="Plan, invoices & payment"
                                    href="/billing"
                                />
                            </div>
                        </div>

                        {/* Recent Summaries Widget */}
                        <div className="rounded-3xl border border-violet-100 bg-white/80 p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Recent Summaries
                                    </h2>
                                </div>
                                <Link
                                    href="/history"
                                    className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-violet-600 outline-none transition-colors hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:text-violet-400"
                                >
                                    View all
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </div>

                            {!recentSummaries || recentSummaries.length === 0 ? (
                                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-8 text-center dark:border-white/10">
                                    <FileText className="h-8 w-8 text-slate-400 dark:text-slate-600" aria-hidden="true" />
                                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        No recent summaries
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        Upload your first PDF to generate a summary.
                                    </p>
                                    <Link
                                        href="/"
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/20 transition-all hover:bg-violet-700"
                                    >
                                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                                        Summarize PDF
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-3">
                                    {recentSummaries.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group flex flex-col justify-between gap-3 rounded-2xl border border-violet-100 bg-white/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-500/30 sm:flex-row sm:items-center"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                                    <FileText className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {item.filename}
                                                    </p>
                                                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {item.summary}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-none items-center gap-3">
                                                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                                    {formatDate(item.created_at)}
                                                </span>
                                                <Link
                                                    href="/history"
                                                    className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50 dark:border-white/10 dark:bg-white/5 dark:text-violet-400 dark:hover:bg-white/10"
                                                >
                                                    Read
                                                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
