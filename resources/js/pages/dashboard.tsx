import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    CreditCard,
    FileText,
    History as HistoryIcon,
    Sparkles,
    TrendingUp,
    Upload,
    Users,
    X,
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
/*  Reusable pieces                                                          */
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

export default function Dashboard({ user, userStats, adminStats, flash }: Props) {
    const [dismissed, setDismissed] = useState(false);
    const isAdmin = user.role === 'admin';

    const usagePercent =
        userStats && userStats.pdfLimit > 0
            ? Math.min(100, Math.round((userStats.pdfCount / userStats.pdfLimit) * 100))
            : 0;
    const isNearLimit = usagePercent >= 80;

    const totalMonthlyRevenue = adminStats?.plans?.reduce(
        (sum, plan) => sum + plan.price * plan.users_count,
        0,
    ) ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            {flash && !dismissed && (flash.success || flash.error) && (
                <FlashToast flash={flash} onDismiss={() => setDismissed(true)} />
            )}

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-6">
                {/* -------------------------------------------------------------- */}
                {/* Header                                                          */}
                {/* -------------------------------------------------------------- */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {isAdmin ? 'Admin overview' : `Welcome back, ${user.name.split(' ')[0]}`}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {isAdmin
                            ? "Here's how your platform is performing today."
                            : "Here's a snapshot of your account and usage."}
                    </p>
                </div>

                {isAdmin ? (
                    <>
                        {/* ---------------------------------------------------------- */}
                        {/* Admin stat cards                                            */}
                        {/* ---------------------------------------------------------- */}
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

                        {/* ---------------------------------------------------------- */}
                        {/* Plans breakdown                                             */}
                        {/* ---------------------------------------------------------- */}
                        <div className="rounded-3xl border border-violet-100 bg-white/80 p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Plans breakdown
                                </h2>
                                <Link
                                    href="/admin/users"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 outline-none transition-colors hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-md dark:text-violet-400"
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
                        {/* User stat cards                                             */}
                        {/* ---------------------------------------------------------- */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <StatCard
                                icon={CreditCard}
                                label="Current plan"
                                value={userStats?.planName ?? 'No plan'}
                                accent="violet"
                            />
                            <StatCard
                                icon={FileText}
                                label="Total summaries"
                                value={userStats?.totalSummaries ?? 0}
                                accent="indigo"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Documents remaining"
                                value={
                                    userStats
                                        ? Math.max(0, userStats.pdfLimit - userStats.pdfCount)
                                        : 0
                                }
                                hint={userStats ? `${userStats.pdfCount} of ${userStats.pdfLimit} used` : undefined}
                                accent={isNearLimit ? 'amber' : 'emerald'}
                            />
                        </div>

                        {/* ---------------------------------------------------------- */}
                        {/* Usage card                                                  */}
                        {/* ---------------------------------------------------------- */}
                        <div className="rounded-3xl border border-violet-100 bg-white/80 p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-violet-600/20">
                                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                                        {userStats?.planName ?? 'No plan'}
                                    </span>
                                    {isNearLimit && (
                                        <span className="text-xs font-medium text-amber-500">
                                            You&apos;re close to your monthly limit
                                        </span>
                                    )}
                                </div>
                                {isNearLimit && (
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 outline-none"
                                    >
                                        Upgrade plan
                                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                    </Link>
                                )}
                            </div>

                            {userStats && (
                                <div className="mt-6">
                                    <div className="mb-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                                        <span>Monthly usage</span>
                                        <span className="font-medium">
                                            {userStats.pdfCount} / {userStats.pdfLimit} documents
                                        </span>
                                    </div>
                                    <div
                                        className="h-2 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-white/10"
                                        role="progressbar"
                                        aria-valuenow={usagePercent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label="Monthly document usage"
                                    >
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isNearLimit
                                                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                                    : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600'
                                            }`}
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ---------------------------------------------------------- */}
                        {/* Quick actions                                               */}
                        {/* ---------------------------------------------------------- */}
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
                    </>
                )}
            </div>
        </AppLayout>
    );
}
