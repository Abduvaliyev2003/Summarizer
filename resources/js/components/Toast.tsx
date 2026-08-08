import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
    duration?: number; // ms, default 4000. 0 = persistent
}

/* -------------------------------------------------------------------------- */
/*  Singleton event bus (no context needed)                                    */
/* -------------------------------------------------------------------------- */

type ToastListener = (toast: ToastItem) => void;
const listeners: Set<ToastListener> = new Set();

let counter = 0;

export const toast = {
    show(message: string, variant: ToastVariant = 'info', duration = 4000): string {
        const id = `toast-${++counter}`;
        const item: ToastItem = { id, message, variant, duration };
        listeners.forEach((fn) => fn(item));
        return id;
    },
    success: (msg: string, dur?: number) => toast.show(msg, 'success', dur),
    error: (msg: string, dur?: number) => toast.show(msg, 'error', dur),
    warning: (msg: string, dur?: number) => toast.show(msg, 'warning', dur),
    info: (msg: string, dur?: number) => toast.show(msg, 'info', dur),
};

/* -------------------------------------------------------------------------- */
/*  Single toast item                                                          */
/* -------------------------------------------------------------------------- */

const variantConfig: Record<
    ToastVariant,
    { icon: typeof CheckCircle2; classes: string; iconClass: string }
> = {
    success: {
        icon: CheckCircle2,
        classes:
            'border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
        iconClass: 'text-emerald-500',
    },
    error: {
        icon: AlertCircle,
        classes:
            'border-rose-200 bg-rose-50/95 text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300',
        iconClass: 'text-rose-500',
    },
    warning: {
        icon: AlertTriangle,
        classes:
            'border-amber-200 bg-amber-50/95 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
        iconClass: 'text-amber-500',
    },
    info: {
        icon: Info,
        classes:
            'border-violet-200 bg-violet-50/95 text-violet-800 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300',
        iconClass: 'text-violet-500',
    },
};

function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
    const [visible, setVisible] = useState(false);
    const { icon: Icon, classes, iconClass } = variantConfig[item.variant];

    // enter animation
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    // auto-dismiss
    useEffect(() => {
        if (!item.duration) return;
        const t = setTimeout(() => dismiss(), item.duration);
        return () => clearTimeout(t);
    }, [item.duration]);

    const dismiss = () => {
        setVisible(false);
        setTimeout(() => onRemove(item.id), 350);
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            style={{
                transition: 'all 350ms cubic-bezier(0.4,0,0.2,1)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
            }}
            className={`flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/10 backdrop-blur-xl ${classes}`}
        >
            <Icon className={`mt-0.5 h-5 w-5 flex-none ${iconClass}`} aria-hidden="true" />
            <p className="flex-1 text-sm font-medium leading-5">{item.message}</p>
            <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="rounded-md p-0.5 outline-none opacity-60 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Container (place once in app root or layout)                               */
/* -------------------------------------------------------------------------- */

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((item: ToastItem) => {
        setToasts((prev) => [...prev, item]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        listeners.add(addToast);
        return () => { listeners.delete(addToast); };
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div
            aria-label="Notifications"
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
        >
            {toasts.map((item) => (
                <div key={item.id} className="pointer-events-auto">
                    <ToastCard item={item} onRemove={removeToast} />
                </div>
            ))}
        </div>
    );
}
