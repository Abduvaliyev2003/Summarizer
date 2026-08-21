import AppLogo from '@/components/app-logo';
import { Link } from '@inertiajs/react';
import { ArrowLeft, FileText, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative min-h-svh overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50 px-4 py-6 sm:px-6 sm:py-8 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-600/15" />
            <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/15" />

            <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
                <Link
                    href={route('home')}
                    className="rounded-xl transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                    <AppLogo />
                </Link>
                <Link
                    href={route('home')}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white/70 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-violet-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back home
                </Link>
            </header>

            <main className="relative z-10 mx-auto grid min-h-[calc(100svh-7rem)] w-full max-w-6xl items-center gap-12 py-8 lg:grid-cols-[1fr_28rem] lg:py-12">
                <section className="hidden max-w-xl lg:block">
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Your smarter document workspace
                    </div>
                    <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Turn every PDF into{' '}
                        <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-300">
                            clear insight.
                        </span>
                    </h1>
                    <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-300">
                        Summarize, compare, and study your documents in one focused workspace.
                    </p>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        <div className="card-glass rounded-2xl p-4 shadow-lg shadow-violet-950/5">
                            <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            <p className="mt-3 font-bold text-slate-900 dark:text-white">Instant clarity</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Summaries tailored to the way you learn.</p>
                        </div>
                        <div className="card-glass rounded-2xl p-4 shadow-lg shadow-violet-950/5">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <p className="mt-3 font-bold text-slate-900 dark:text-white">Private by design</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Your workspace stays secure and personal.</p>
                        </div>
                    </div>
                </section>

                <section className="card-glass mx-auto w-full max-w-md rounded-3xl border border-white/70 p-6 shadow-2xl shadow-violet-950/10 sm:p-8 dark:border-white/10">
                    <div className="mb-7 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 lg:hidden">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                    </div>
                    {children}
                </section>
            </main>
        </div>
    );
}
