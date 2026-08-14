import { getXsrfTokenFromCookie } from '@/lib/csrf';
import { Plan } from '@/types';
import { AlertCircle, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface HostedCheckoutButtonProps {
    plan: Plan;
    formattedPrice: string;
    userEmail?: string;
    userName?: string;
}

export function HostedCheckoutButton({
    plan,
    formattedPrice,
    userEmail,
    userName,
}: HostedCheckoutButtonProps) {
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (processing) return;

        setProcessing(true);
        setErrorMessage(null);

        try {
            const csrfToken = getXsrfTokenFromCookie();
            const response = await fetch(`/subscription/create-checkout-session/${plan.slug}`, {
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
                    <p className="mt-2">
                        You will be redirected to Stripe to complete your subscription for the {plan.name} plan.
                    </p>
                    {userEmail && (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Email:</span> {userEmail}
                        </p>
                    )}
                    {userName && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Name:</span> {userName}
                        </p>
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
