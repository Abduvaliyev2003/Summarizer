import { TrendingDown, TrendingUp } from 'lucide-react';
import { type ElementType } from 'react';

interface StatCardProps {
    icon: ElementType;
    label: string;
    value: string | number;
    hint?: string;
    trend?: number;
    accent?: 'violet' | 'emerald' | 'indigo' | 'amber';
    className?: string;
}

export function StatCard({
    icon: Icon,
    label,
    value,
    hint,
    trend,
    accent = 'violet',
    className = '',
}: StatCardProps) {
    const accentStyles = {
        violet: 'from-violet-500/10 to-purple-500/5 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-white/10',
        emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-white/10',
        indigo: 'from-indigo-500/10 to-blue-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-white/10',
        amber: 'from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-white/10',
    };

    return (
        <div
            className={`relative overflow-hidden rounded-3xl border border-violet-100/80 bg-white/80 p-6 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl dark:border-white/10 dark:bg-white/5 ${className}`}
        >
            <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentStyles[accent]}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                {trend !== undefined && (
                    <div
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            trend >= 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                    >
                        {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trend >= 0 ? `+${trend}%` : `${trend}%`}
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {value}
                </p>
                {hint && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
            </div>
        </div>
    );
}
