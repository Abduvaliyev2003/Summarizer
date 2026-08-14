import { FaqAccordion } from '@/components/checkout/faq-accordion';
import { HostedCheckoutButton } from '@/components/checkout/hosted-checkout-button';
import { SectionCard } from '@/components/ui/section-card';
import { TrustBadge } from '@/components/ui/trust-badge';
import { formatPrice } from '@/lib/format';
import { Plan } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BadgeCheck,
    Check,
    Clock,
    CreditCard,
    Lock,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Star,
    Users,
    Zap,
} from 'lucide-react';

interface Props {
    plan?: Plan;
    stripeKey?: string;
    auth?: {
        user?: {
            name: string;
            email: string;
        };
    };
}

const INCLUDED_FEATURES: string[] = [
    'Unlimited access to core workspace tools',
    'Priority email & chat support',
    'Automatic cloud backups every 24 hours',
    'Advanced analytics & usage reporting',
    'Team collaboration with role permissions',
];

function FeatureRow({ label }: { label: string }) {
    return (
        <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">{label}</span>
        </li>
    );
}

export default function Checkout({ plan, stripeKey, auth }: Props) {
    const safePlan = plan
        ? {
              ...plan,
              features:
                  typeof plan.features === 'string'
                      ? (JSON.parse(plan.features) as string[])
                      : plan.features,
          }
        : null;

    const formattedPrice = safePlan ? formatPrice(safePlan.price) : '$0.00';
    const userInitial = auth?.user?.name?.charAt(0).toUpperCase() ?? 'U';

    return (
        <>
            <Head title={safePlan ? `Checkout — ${safePlan.name} Plan` : 'Checkout'} />

            <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                {/* Background glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className="absolute -left-24 -top-32 h-96 w-96 animate-pulse rounded-full bg-violet-400/20 blur-3xl [animation-duration:6s]" />
                    <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-pulse rounded-full bg-indigo-400/20 blur-3xl [animation-duration:8s]" />
                    <div className="absolute bottom-0 left-1/4 h-80 w-80 animate-pulse rounded-full bg-purple-400/10 blur-3xl [animation-duration:7s]" />
                </div>

                {/* Top Nav */}
                <nav className="relative z-20 border-b border-violet-100/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            aria-label="Go to homepage"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-600/30">
                                <Sparkles className="h-4.5 w-4.5 text-white" aria-hidden="true" />
                            </span>
                            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                PDF<span className="text-violet-600">Summarizer</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-3 sm:gap-5">
                            <Link
                                href="/billing"
                                className="hidden items-center gap-1.5 rounded-lg text-sm font-medium text-slate-600 outline-hidden transition-colors hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:flex dark:text-slate-300 dark:hover:text-violet-400"
                            >
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                Back to Billing
                            </Link>

                            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 sm:flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                Secure Checkout
                            </div>

                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-md"
                                title={auth?.user?.name ?? 'Guest'}
                            >
                                {userInitial}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <header className="relative z-10 px-6 pt-14 pb-10 text-center sm:pt-20">
                    <div className="mx-auto max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Checkout
                        </span>
                        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            Complete your{' '}
                            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                subscription
                            </span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-400">
                            You&apos;re one step away from unlocking everything on the{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {safePlan?.name ?? 'selected'}
                            </span>{' '}
                            plan. Cancel anytime.
                        </p>
                    </div>
                </header>

                {!safePlan ? (
                    <div className="relative z-10 mx-auto max-w-md px-6 pb-24 text-center">
                        <SectionCard className="p-10">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                                <CreditCard className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                No plan selected
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                We couldn&apos;t find a plan to check out with. Head back to billing and pick the plan that fits you best.
                            </p>
                            <Link
                                href="/billing"
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 outline-hidden transition-all hover:scale-[1.02] hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500"
                            >
                                View Plans
                            </Link>
                        </SectionCard>
                    </div>
                ) : !stripeKey ? (
                    <div className="relative z-10 mx-auto max-w-md px-6 pb-24 text-center">
                        <SectionCard className="p-10">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                                <AlertCircle className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Payments aren&apos;t configured yet
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Missing Stripe publishable key. Add <code>STRIPE_KEY</code> to your environment to enable checkout.
                            </p>
                        </SectionCard>
                    </div>
                ) : (
                    <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            {/* LEFT COLUMN */}
                            <div className="space-y-8 lg:col-span-2">
                                <SectionCard className="p-8">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs">
                                                <Zap className="h-3 w-3" aria-hidden="true" />
                                                {safePlan.name} Plan
                                            </span>
                                            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                                                {safePlan.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                                {formattedPrice}
                                                <span className="text-base font-medium text-slate-400">/mo</span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Billed monthly
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-violet-100 pt-6 dark:border-white/10">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Users className="h-4 w-4 text-violet-500" aria-hidden="true" />
                                            Up to {safePlan.pdf_limit} documents / month
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <RefreshCw className="h-4 w-4 text-violet-500" aria-hidden="true" />
                                            Renews automatically
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard className="p-8">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        What&apos;s included
                                    </h2>
                                    <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {((safePlan.features && safePlan.features.length > 0) ? safePlan.features : INCLUDED_FEATURES).map(
                                            (feature) => (
                                                <FeatureRow key={feature} label={feature} />
                                            ),
                                        )}
                                    </ul>
                                </SectionCard>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <SectionCard className="p-6">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                                <Clock className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    Monthly billing cycle
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Cancel anytime, no lock-in
                                                </p>
                                            </div>
                                        </div>
                                    </SectionCard>

                                    <SectionCard className="p-6">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                                <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    30-day money back
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Full refund, no questions asked
                                                </p>
                                            </div>
                                        </div>
                                    </SectionCard>
                                </div>

                                <SectionCard className="p-8">
                                    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                                        ))}
                                    </div>
                                    <blockquote className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        &ldquo;Switching to the {safePlan.name} plan paid for itself in the first week. The onboarding was effortless and support has been fantastic ever since.&rdquo;
                                    </blockquote>
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                                            MK
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Maya K.</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Product Lead, Operations Team</p>
                                        </div>
                                    </div>
                                </SectionCard>

                                <SectionCard className="p-8">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Frequently asked questions
                                    </h2>
                                    <FaqAccordion />
                                </SectionCard>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-6 space-y-6">
                                    <SectionCard className="p-8">
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            Order summary
                                        </h2>

                                        <dl className="mt-6 space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <dt className="text-slate-600 dark:text-slate-400">
                                                    {safePlan.name} Plan (monthly)
                                                </dt>
                                                <dd className="font-medium text-slate-900 dark:text-white">
                                                    {formattedPrice}
                                                </dd>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <dt className="text-slate-600 dark:text-slate-400">Tax</dt>
                                                <dd className="font-medium text-slate-500 dark:text-slate-400">
                                                    Calculated at checkout
                                                </dd>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-violet-100 pt-4 text-base dark:border-white/10">
                                                <dt className="font-semibold text-slate-900 dark:text-white">
                                                    Total due today
                                                </dt>
                                                <dd className="text-xl font-extrabold text-slate-900 dark:text-white">
                                                    {formattedPrice}
                                                </dd>
                                            </div>
                                        </dl>

                                        <div className="mt-7 border-t border-violet-100 pt-7 dark:border-white/10">
                                            <HostedCheckoutButton
                                                plan={safePlan}
                                                formattedPrice={formattedPrice}
                                                userEmail={auth?.user?.email}
                                                userName={auth?.user?.name}
                                            />
                                        </div>

                                        <div className="mt-6 border-t border-violet-100 pt-6 dark:border-white/10">
                                            <TrustBadge type="stripe" />
                                        </div>
                                    </SectionCard>
                                </div>
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </>
    );
}
