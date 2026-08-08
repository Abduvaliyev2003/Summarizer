import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    ArrowUpRight,
    CheckCircle2,
    CreditCard,
    FileText,
    Sparkles,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Billing',
        href: '/billing',
    },
];

interface UserStats {
    pdfCount: number;
    pdfLimit: number;
    planName: string;
    totalSummaries: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    stripe_subscription_id?: string | null;
    subscription_ends_at?: string | null;
    plan?: {
        id: number;
        name: string;
        pdf_limit: number;
        price: number;
    };
}

interface Props {
    auth: { user: User };
    userStats: UserStats;
    flash?: { success?: string; error?: string };
}

/* -------------------------------------------------------------------------- */
/*  Circular ring (mini variant)                                               */
/* -------------------------------------------------------------------------- */

function MiniRing({ percent, isNearLimit, isUnlimited }: { percent: number; isNearLimit: boolean; isUnlimited: boolean }) {
    const size = 80;
    const sw = 8;
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;

    return (
        <div className="relative flex-none" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id="miniGradV" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="miniGradA" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="miniGradG" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} className="stroke-violet-100 dark:stroke-white/10" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={isUnlimited ? 'url(#miniGradG)' : isNearLimit ? 'url(#miniGradA)' : 'url(#miniGradV)'}
                    strokeWidth={sw} strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={isUnlimited ? 0 : offset}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isUnlimited ? (
                    <Zap className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                ) : (
                    <span className={`text-sm font-extrabold ${isNearLimit ? 'text-amber-500' : 'text-violet-600 dark:text-violet-400'}`}>
                        {percent}%
                    </span>
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Billing({ auth, userStats, flash }: Props) {
    const user = auth.user;
    const [cancelling, setCancelling] = useState(false);

    const pdfCount = userStats?.pdfCount ?? 0;
    const pdfLimit = userStats?.pdfLimit ?? 0;
    const planName = userStats?.planName ?? 'No Plan';
    const totalSummaries = userStats?.totalSummaries ?? 0;

    const isUnlimited = pdfLimit < 0;
    const usagePercent =
        isUnlimited || pdfLimit === 0 ? 0 : Math.min(100, Math.round((pdfCount / pdfLimit) * 100));
    const isNearLimit = usagePercent >= 80 && !isUnlimited;
    const hasSubscription = Boolean(user.stripe_subscription_id);

    const handleCancel = () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) return;
        setCancelling(true);
        router.post(
            route('subscription.cancel'),
            {},
            {
                preserveScroll: true,
                onFinish: () => setCancelling(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing - PDF Summarizer" />

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-6">
                {/* Flash */}
                {flash?.success && (
                    <div role="alert" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-xl dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 flex-none" aria-hidden="true" />
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Billing & Subscription
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage your plan, usage, and payment details.
                    </p>
                </div>

                {/* Usage + Plan hero */}
                <div className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 ${
                    isNearLimit
                        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5'
                        : 'border-violet-100 bg-white/80 dark:border-white/10 dark:bg-white/5'
                }`}>
                    {/* glow */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-violet-400/20 to-transparent blur-2xl dark:from-violet-600/10" aria-hidden="true" />

                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-5">
                            <MiniRing percent={isUnlimited ? 100 : usagePercent} isNearLimit={isNearLimit} isUnlimited={isUnlimited} />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Monthly usage
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                                    {isUnlimited ? (
                                        <span className="text-emerald-500">Unlimited</span>
                                    ) : (
                                        <>
                                            <span className={isNearLimit ? 'text-amber-500' : 'bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'}>
                                                {pdfCount}
                                            </span>
                                            <span className="text-lg font-semibold text-slate-400"> / {pdfLimit}</span>
                                        </>
                                    )}
                                </p>
                                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                    {isUnlimited
                                        ? 'No limit — use as much as you need'
                                        : `${Math.max(0, pdfLimit - pdfCount)} documents remaining this month`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 sm:items-end">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                                <Sparkles className="h-3 w-3" aria-hidden="true" />
                                {planName}
                            </span>
                            {!hasSubscription && (
                                <Link
                                    href="/checkout/pro"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-violet-600/40 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 outline-none"
                                >
                                    <Zap className="h-4 w-4" aria-hidden="true" />
                                    Upgrade plan
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Plan card */}
                    <div className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-900/10 dark:border-white/10 dark:bg-white/5">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <CreditCard className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">{planName}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Current plan</p>
                        {user.plan?.price !== undefined && (
                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                {user.plan.price === 0
                                    ? 'Free — no charge'
                                    : `$${user.plan.price}/month`}
                            </p>
                        )}
                    </div>

                    {/* Total summaries */}
                    <div className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-900/10 dark:border-white/10 dark:bg-white/5">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <FileText className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">{totalSummaries}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Total summaries</p>
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">All time</p>
                    </div>

                    {/* Remaining */}
                    <div className={`rounded-3xl border p-6 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-900/10 ${
                        isNearLimit
                            ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5'
                            : 'border-violet-100 bg-white/80 dark:border-white/10 dark:bg-white/5'
                    }`}>
                        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isNearLimit ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            <TrendingUp className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
                            {isUnlimited ? '∞' : Math.max(0, pdfLimit - pdfCount)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Documents remaining</p>
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            {isUnlimited ? 'Unlimited plan' : `${pdfCount} of ${pdfLimit} used`}
                        </p>
                    </div>
                </div>

                {/* Subscription actions */}
                {hasSubscription && (
                    <div className="rounded-3xl border border-violet-100 bg-white/80 p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Subscription</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            You have an active subscription. You can cancel it at any time.
                        </p>
                        {user.subscription_ends_at && (
                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                Renews on{' '}
                                {new Date(user.subscription_ends_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        )}
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/checkout/pro"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-600/40 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 outline-none"
                            >
                                Change plan
                                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <button
                                type="button"
                                disabled={cancelling}
                                onClick={handleCancel}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-rose-600 outline-none transition-all duration-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-white/5 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                            </button>
                        </div>
                    </div>
                )}

                {/* No subscription CTA */}
                {!hasSubscription && (
                    <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white/80 to-indigo-50/80 p-8 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:from-violet-900/10 dark:via-white/5 dark:to-indigo-900/10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-600/25">
                            <Zap className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                            Unlock more power
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                            Upgrade to a paid plan to increase your monthly PDF limit, get priority processing, and
                            access advanced summary options.
                        </p>
                        <Link
                            href="/checkout/pro"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-violet-600/40 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 outline-none"
                        >
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            View plans & upgrade
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
