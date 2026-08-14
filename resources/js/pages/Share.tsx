import { Head, Link } from '@inertiajs/react';
import { FileText, Sparkles, Clock, Globe, ArrowLeft, Copy, Check } from 'lucide-react';
import { useState, useMemo } from 'react';
import StudySuiteViewer from '@/components/StudySuiteViewer';
import PdfComparisonViewer from '@/components/PdfComparisonViewer';

interface Props {
    summary: {
        id: number;
        filename: string;
        summary: string;
        target_language: string;
        created_at: string;
    };
}

const LANG_NAMES: Record<string, string> = {
    uz: "O'zbekcha 🇺🇿",
    en: 'English 🇬🇧',
    ru: 'Русский 🇷🇺',
    de: 'Deutsch 🇩🇪',
    es: 'Español 🇪🇸',
    fr: 'Français 🇫🇷',
    tr: 'Türkçe 🇹🇷',
};

export default function Share({ summary }: Props) {
    const [copied, setCopied] = useState(false);

    const isStudySuite = summary.summary.includes('=== FLASHCARDS ===') || summary.summary.includes('=== EXAM QUIZ ===') || summary.summary.includes('=== KEY CONCEPTS ===');
    const isComparison = summary.summary.includes('=== COMPARATIVE MATRIX ===');

    const contentLabel = useMemo(() => {
        if (isComparison) return '⚔️ Multi-PDF Comparison';
        if (isStudySuite) return '🎓 Student Study Suite';
        return '📄 PDF Summary';
    }, [isComparison, isStudySuite]);

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Head title={`${summary.filename} — Shared Summary`}>
                <meta name="description" content={`AI-generated summary of ${summary.filename}`} />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/10">

                {/* Navbar */}
                <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-base font-bold text-slate-900 dark:text-white">PDF Summarizer</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>

                            <Link
                                href="/"
                                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Try PDF Summarizer
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

                    {/* Header Card */}
                    <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/20">
                                    <FileText className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                </div>

                                <div>
                                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                                        <Sparkles className="h-3 w-3" />
                                        {contentLabel}
                                    </span>
                                    <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                        {summary.filename}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {summary.created_at}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" />
                                    {LANG_NAMES[summary.target_language] ?? summary.target_language}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Content */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
                        {isComparison ? (
                            <PdfComparisonViewer rawContent={summary.summary} />
                        ) : isStudySuite ? (
                            <StudySuiteViewer rawContent={summary.summary} />
                        ) : (
                            <div className="space-y-3">
                                {summary.summary.split('\n').map((line, i) => (
                                    <p
                                        key={i}
                                        className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-300"
                                    >
                                        {line || '\u00A0'}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CTA Footer */}
                    <div className="mt-10 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 text-center shadow-2xl shadow-violet-500/20">
                        <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/80" />
                        <h2 className="text-xl font-bold text-white">Create your own AI summaries</h2>
                        <p className="mt-2 text-sm text-violet-200">
                            Upload any PDF and let AI generate summaries, flashcards, quizzes, and comparisons in seconds.
                        </p>
                        <Link
                            href="/"
                            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-violet-700 shadow-lg hover:bg-violet-50"
                        >
                            <Sparkles className="h-4 w-4" />
                            Get Started Free →
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}
