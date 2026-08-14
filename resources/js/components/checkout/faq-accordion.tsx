import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface FaqEntry {
    question: string;
    answer: string;
}

const DEFAULT_FAQS: FaqEntry[] = [
    {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes. You can cancel from your billing settings at any time — you’ll keep access until the end of your current billing period, no questions asked.',
    },
    {
        question: 'Will my card be charged automatically?',
        answer: 'Your subscription renews automatically on your billing date. We’ll always send a receipt by email, and you can turn off auto-renew anytime.',
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

export function FaqAccordion({ faqs = DEFAULT_FAQS }: { faqs?: FaqEntry[] }) {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    return (
        <div className="mt-2">
            {faqs.map((entry, index) => {
                const isOpen = openFaqIndex === index;
                const panelId = `faq-panel-${index}`;
                const buttonId = `faq-trigger-${index}`;

                return (
                    <div key={entry.question} className="border-b border-violet-100 last:border-b-0 dark:border-white/10">
                        <h3>
                            <button
                                id={buttonId}
                                type="button"
                                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
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
            })}
        </div>
    );
}
