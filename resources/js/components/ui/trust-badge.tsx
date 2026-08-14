import { ShieldCheck, Lock, RefreshCw } from 'lucide-react';

interface TrustBadgeProps {
    type?: 'security' | 'stripe' | 'guarantee';
    className?: string;
}

export function TrustBadge({ type = 'security', className = '' }: TrustBadgeProps) {
    if (type === 'stripe') {
        return (
            <div className={`flex items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-violet-50/50 py-3 px-4 text-xs font-bold text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-violet-300 ${className}`}>
                <Lock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>Encrypted 256-bit SSL Payment via Stripe</span>
            </div>
        );
    }

    if (type === 'guarantee') {
        return (
            <div className={`flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 py-3 px-4 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300 ${className}`}>
                <RefreshCw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Cancel anytime in 1-click without hidden fees</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Bank-grade security & privacy guarantee</span>
        </div>
    );
}
