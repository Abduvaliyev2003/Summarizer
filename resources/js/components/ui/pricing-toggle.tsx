import { useState } from 'react';

interface PricingToggleProps {
    onChange: (billing: 'monthly' | 'yearly') => void;
    defaultBilling?: 'monthly' | 'yearly';
}

/**
 * A pill-style toggle that switches between Monthly and Yearly billing.
 * Calls `onChange` whenever the selection changes.
 */
export function PricingToggle({ onChange, defaultBilling = 'monthly' }: PricingToggleProps) {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>(defaultBilling);

    const select = (value: 'monthly' | 'yearly') => {
        setBilling(value);
        onChange(value);
    };

    return (
        <div className="inline-flex items-center gap-3">
            <span
                className={`text-sm font-semibold transition-colors ${
                    billing === 'monthly'
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                }`}
            >
                Monthly
            </span>

            {/* Toggle track */}
            <button
                type="button"
                role="switch"
                aria-checked={billing === 'yearly'}
                onClick={() => select(billing === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                    billing === 'yearly'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                }`}
            >
                <span className="sr-only">Toggle billing period</span>
                {/* Pill thumb */}
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                        billing === 'yearly' ? 'translate-x-7' : 'translate-x-0'
                    }`}
                />
            </button>

            <div className="flex items-center gap-2">
                <span
                    className={`text-sm font-semibold transition-colors ${
                        billing === 'yearly'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                    Yearly
                </span>

                {/* "2 Months Free" badge — only visible when yearly is active */}
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all duration-300 ${
                        billing === 'yearly'
                            ? 'scale-100 bg-emerald-100 text-emerald-700 opacity-100 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'scale-75 opacity-0'
                    }`}
                >
                    2 Months Free
                </span>
            </div>
        </div>
    );
}
