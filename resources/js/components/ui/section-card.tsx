import { type ReactNode } from 'react';

interface SectionCardProps {
    children: ReactNode;
    className?: string;
    glow?: boolean;
}

export function SectionCard({ children, className = '', glow = false }: SectionCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-white/5 ${className}`}
        >
            {glow && (
                <div
                    className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-violet-400/20 via-purple-400/10 to-transparent blur-2xl dark:from-violet-600/15"
                    aria-hidden="true"
                />
            )}
            {children}
        </div>
    );
}
