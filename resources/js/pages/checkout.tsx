import { useState, type FormEvent, type ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Check,
    Sparkles,
    CreditCard,
    Lock,
    ArrowLeft,
    ShieldCheck,
    BadgeCheck,
    RefreshCw,
    ChevronDown,
    Star,
    Loader2,
    Zap,
    Clock,
    Users,
    AlertCircle,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    pdf_limit: number;
    features: string[] | string;
    is_active: boolean;
}

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

interface FaqEntry {
    question: string;
    answer: string;
}

/* -------------------------------------------------------------------------- */
/*  Static content                                                            */
/* -------------------------------------------------------------------------- */

const INCLUDED_FEATURES: string[] = [
    'Unlimited access to core workspace tools',
    'Priority email & chat support',
    'Automatic cloud backups every 24 hours',
    'Advanced analytics & usage reporting',
    'Team collaboration with role permissions',
];

const FAQS: FaqEntry[] = [
    {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes. You can cancel from your billing settings at any time — you\u2019ll keep access until the end of your current billing period, no questions asked.',
    },
    {
        question: 'Will my card be charged automatically?',
        answer: 'Your subscription renews automatically on your billing date. We\u2019ll always send a receipt by email, and you can turn off auto-renew anytime.',
    },
    {
        question: 'Is my payment information secure?',
        answer: 'Absolutely. Payments are processed entirely by Stripe with 256-bit encryption. We never see or store your full card details on our servers.',
    },
    {
        question: 'What happens if I upgrade or downgrade later?',
        answer: 'You can switch plans whenever you like. Charges are prorated automatically, so you only ever pay for what you use.',
    },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getCsrfToken(): string {
    const metaToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content?.trim();
    if (metaToken) {
        return metaToken;
    }

    const cookieToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    return cookieToken ? decodeURIComponent(cookieToken) : '';
}


/* -------------------------------------------------------------------------- */
/*  Small reusable pieces                                                      */
/* -------------------------------------------------------------------------- */

function SectionCard({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-3xl border border-violet-100 bg-white/80 backdrop-blur-xl shadow-xl shadow-violet-900/5 dark:border-white/10 dark:bg-white/5 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 ${className}`}
        >
            {children}
        </div>
    );
}

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

function TrustBadge({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
    return (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Icon className="h-4 w-4 flex-none text-violet-500" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

function FaqAccordionItem({
    entry,
    isOpen,
    onToggle,
    index,
}: {
    entry: FaqEntry;
    isOpen: boolean;
    onToggle: () => void;
    index: number;
}) {
    const panelId = `faq-panel-${index}`;
    const buttonId = `faq-trigger-${index}`;

    return (
        <div className="border-b border-violet-100 last:border-b-0 dark:border-white/10">
            <h3>
                <button
                    id={buttonId}
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-900 outline-none transition-colors hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-lg dark:text-white dark:hover:text-violet-400"
                >
                    {entry.question}
                    <ChevronDown
                        className={`h-4 w-4 flex-none text-violet-500 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                    />
                </button>
            </h3>
            <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{entry.answer}</p>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Hosted Stripe Checkout button                                             */
/* -------------------------------------------------------------------------- */

function HostedCheckoutButton({ plan, formattedPrice, userEmail, userName }: { plan: Plan; formattedPrice: string; userEmail?: string; userName?: string }) {
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (processing) return;

        setProcessing(true);
        setErrorMessage(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch(`/subcription/create-checkout-session/${plan.slug}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken
                        ? {
                              'X-CSRF-TOKEN': csrfToken,
                              'X-XSRF-TOKEN': csrfToken,
                          }
                        : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify({}),
            });

            const data = await response.json().catch(() => null);

            if (response.ok && data?.url) {
                window.location.href = data.url;
                return;
            }

            throw new Error(data?.error || 'Unable to start checkout. Please try again.');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Unable to start checkout. Please try again.');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium text-slate-900 dark:text-white">Secure hosted checkout</p>
                    <p className="mt-2">You will be redirected to Stripe to complete your subscription for the {plan.name} plan.</p>
                    {userEmail && (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Email:</span> {userEmail}
                        </p>
                    )}
                    {userName && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Name:</span> {userName}</p>
                    )}
                </div>
            </div>

            {errorMessage && (
                <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={processing}
                aria-busy={processing}
                aria-label={`Subscribe and pay ${formattedPrice}`}
                className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-600/40 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
                {processing ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Redirecting to Stripe&hellip;
                    </>
                ) : (
                    <>
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        Subscribe for {formattedPrice}
                    </>
                )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                Payments secured & processed by Stripe
            </p>
        </form>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */


export default function Checkout({ plan, stripeKey, auth }: Props) {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const safePlan = plan
        ? {
              ...plan,
              features:
                  typeof plan.features === 'string'
                      ? (JSON.parse(plan.features) as string[])
                      : plan.features,
          }
        : null;

    const formattedPrice = safePlan
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safePlan.price)
        : '$0.00';

    const userInitial = auth?.user?.name?.charAt(0).toUpperCase() ?? 'U';

    return (
        <>
            <Head title={safePlan ? `Checkout — ${safePlan.name} Plan` : 'Checkout'} />

            <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                {/* Ambient floating shapes */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className="absolute -top-32 -left-24 h-96 w-96 animate-pulse rounded-full bg-violet-400/20 blur-3xl [animation-duration:6s]" />
                    <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] animate-pulse rounded-full bg-indigo-400/20 blur-3xl [animation-duration:8s]" />
                    <div className="absolute bottom-0 left-1/4 h-80 w-80 animate-pulse rounded-full bg-purple-400/10 blur-3xl [animation-duration:7s]" />
                </div>

                {/* ---------------------------------------------------------------- */}
                {/* Top navigation                                                    */}
                {/* ---------------------------------------------------------------- */}
                <nav className="relative z-20 border-b border-violet-100/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            aria-label="Go to homepage"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-600/30">
                                <Sparkles className="h-4.5 w-4.5 text-white" aria-hidden="true" />
                            </span>
                            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                Brand<span className="text-violet-600">Name</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-3 sm:gap-5">
                            <Link
                                href="/pricing"
                                className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-violet-600 sm:flex dark:text-slate-300 dark:hover:text-violet-400 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                            >
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                Back to Pricing
                            </Link>

                            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 sm:flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                Secure Checkout
                            </div>

                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-md"
                                aria-label={auth?.user?.name ? `Signed in as ${auth.user.name}` : 'Guest user'}
                                title={auth?.user?.name ?? 'Guest'}
                            >
                                {userInitial}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ---------------------------------------------------------------- */}
                {/* Hero                                                              */}
                {/* ---------------------------------------------------------------- */}
                <header className="relative z-10 px-6 pb-10 pt-14 text-center sm:pt-20">
                    <div className="mx-auto max-w-2xl animate-[fadeIn_0.6s_ease-out]">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Checkout
                        </span>
                        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
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
                            plan. Cancel or change plans anytime.
                        </p>
                    </div>
                </header>

                {/* ---------------------------------------------------------------- */}
                {/* No plan — empty state                                            */}
                {/* ---------------------------------------------------------------- */}
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
                                We couldn&apos;t find a plan to check out with. Head back to pricing and pick the
                                plan that fits you best.
                            </p>
                            <Link
                                href="/pricing"
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] hover:bg-violet-700 hover:shadow-violet-600/40 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 outline-none"
                            >
                                View Pricing Plans
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
                                Missing Stripe publishable key. Add <code>STRIPE_KEY</code> to your environment to
                                enable checkout.
                            </p>
                        </SectionCard>
                    </div>
                ) : (
                    <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            {/* ============================================================ */}
                            {/* LEFT COLUMN                                                    */}
                            {/* ============================================================ */}
                            <div className="space-y-8 lg:col-span-2">
                                {/* Plan card */}
                                <SectionCard className="animate-[slideUp_0.5s_ease-out] p-8">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
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

                                {/* What's included */}
                                <SectionCard className="p-8">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        What&apos;s included
                                    </h2>
                                    <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {(safePlan.features.length > 0 ? safePlan.features : INCLUDED_FEATURES).map(
                                            (feature) => (
                                                <FeatureRow key={feature} label={feature} />
                                            ),
                                        )}
                                    </ul>
                                </SectionCard>

                                {/* Billing cycle & guarantee */}
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

                                {/* Testimonial */}
                                <SectionCard className="p-8">
                                    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className="h-4 w-4 fill-amber-400 text-amber-400"
                                                aria-hidden="true"
                                            />
                                        ))}
                                    </div>
                                    <blockquote className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        &ldquo;Switching to the {safePlan.name} plan paid for itself in the first
                                        week. The onboarding was effortless and support has been fantastic ever
                                        since.&rdquo;
                                    </blockquote>
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                                            MK
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Maya K.
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Product Lead, Operations Team
                                            </p>
                                        </div>
                                    </div>
                                </SectionCard>

                                {/* FAQ */}
                                <SectionCard className="p-8">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Frequently asked questions
                                    </h2>
                                    <div className="mt-2">
                                        {FAQS.map((entry, index) => (
                                            <FaqAccordionItem
                                                key={entry.question}
                                                entry={entry}
                                                index={index}
                                                isOpen={openFaqIndex === index}
                                                onToggle={() =>
                                                    setOpenFaqIndex(openFaqIndex === index ? null : index)
                                                }
                                            />
                                        ))}
                                    </div>
                                </SectionCard>
                            </div>

                            {/* ============================================================ */}
                            {/* RIGHT COLUMN — Checkout card with embedded Stripe form         */}
                            {/* ============================================================ */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-6 space-y-6">
                                    <SectionCard className="animate-[slideUp_0.5s_ease-out] p-8">
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

                                        {/* Hosted Stripe Checkout button */}
                                        <div className="mt-7 border-t border-violet-100 pt-7 dark:border-white/10">
                                            <HostedCheckoutButton
                                                plan={safePlan}
                                                formattedPrice={formattedPrice}
                                                userEmail={auth?.user?.email}
                                                userName={auth?.user?.name}
                                            />
                                        </div>

                                        {/* Security badges */}
                                        <div className="mt-6 grid grid-cols-1 gap-2.5 border-t border-violet-100 pt-6 dark:border-white/10">
                                            <TrustBadge icon={Lock} label="256-bit SSL encryption" />
                                            <TrustBadge icon={ShieldCheck} label="PCI DSS compliant" />
                                            <TrustBadge icon={RefreshCw} label="Cancel anytime, no fees" />
                                            <TrustBadge icon={BadgeCheck} label="30-day money back guarantee" />
                                        </div>
                                    </SectionCard>

                                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                        Trusted by thousands of teams worldwide
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                )}

                {/* ---------------------------------------------------------------- */}
                {/* Footer                                                            */}
                {/* ---------------------------------------------------------------- */}
                <footer className="relative z-10 border-t border-violet-100/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
                        <p>&copy; {new Date().getFullYear()} BrandName, Inc. All rights reserved.</p>
                        <nav className="flex items-center gap-5" aria-label="Footer">
                            <Link
                                href="/terms"
                                className="rounded-md outline-none transition-colors hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:hover:text-violet-400"
                            >
                                Terms
                            </Link>
                            <Link
                                href="/privacy"
                                className="rounded-md outline-none transition-colors hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:hover:text-violet-400"
                            >
                                Privacy
                            </Link>
                            <Link
                                href="/support"
                                className="rounded-md outline-none transition-colors hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:hover:text-violet-400"
                            >
                                Support
                            </Link>
                            <Link
                                href="/contact"
                                className="rounded-md outline-none transition-colors hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:hover:text-violet-400"
                            >
                                Contact
                            </Link>
                        </nav>
                    </div>
                </footer>
            </div>
        </>
    );
}