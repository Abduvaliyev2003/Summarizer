import {
    useState,
    useRef,
    useEffect,
    type DragEvent,
    type ChangeEvent,
} from 'react';

import { Head, Link, router } from '@inertiajs/react';

import {
    Check,
    Sparkles,
    Zap,
    Rocket,
    ArrowRight,
    Star,
    FileText,
    Upload,
    ShieldCheck,
    Clock,
    Lock,
    Globe,
    GitCompare,
    Plus,
    Trash2,
    CheckCircle2,
    Loader2,
} from 'lucide-react';

import FlashMessage from '@/components/FlashMessage';
import SummaryModal from '@/components/SummaryModal';
import SummaryOptionsModal from '@/components/SummaryOptionsModal';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { PricingToggle } from '@/components/ui/pricing-toggle';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    pdf_limit: number;
    features: string[];
}

interface Props {
    plans?: Plan[];
    canRegister: boolean;

    auth?: {
        user?: {
            id?: number;
            name?: string;
            email?: string;
            plan?: {
                slug?: string;
                name?: string;
            };
        };
    };

    userStats?: {
        pdfCount: number;
        pdfLimit: number;
        canUpload: boolean;
    } | null;

    flash: {
        success?: string;
        error?: string;
    } | null;
}

type SummaryType =
    | 'default'
    | 'points'
    | 'highlight'
    | 'detailed'
    | 'quiz';

export default function Welcome({
    plans,
    canRegister,
    auth,
    userStats,
    flash,
}: Props) {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [pdf, setPdf] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [summary, setSummary] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    const [showSummaryOptionsModal, setShowSummaryOptionsModal] =
        useState(false);

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const isAuthenticated = Boolean(auth?.user);

    const limitReached = Boolean(
        userStats && !userStats.canUpload
    );

    const userPlanSlug =
        auth?.user?.plan?.slug || 'free';

    const safePlans: Plan[] = Array.isArray(plans)
        ? plans.map((plan) => ({
              ...plan,
              features: Array.isArray(plan.features)
                  ? plan.features
                  : [],
          }))
        : [];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | File validation
    |--------------------------------------------------------------------------
    */

    const validateFile = (file: File): boolean => {
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file.');
            return false;
        }

        // 20 MB maximum
        const maxSize = 20 * 1024 * 1024;

        if (file.size > maxSize) {
            alert('The PDF file must be smaller than 20 MB.');
            return false;
        }

        return true;
    };

    /*
    |--------------------------------------------------------------------------
    | File selection
    |--------------------------------------------------------------------------
    */

    const handleFileSelect = (file: File) => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (limitReached) {
            alert(
                'You have reached your PDF upload limit. Please upgrade your plan to upload more PDFs.'
            );

            return;
        }

        if (!validateFile(file)) {
            return;
        }

        setSelectedFile(file);
        setPdf(file);

        setShowSummaryOptionsModal(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Input change
    |--------------------------------------------------------------------------
    */

    const handleFileChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        handleFileSelect(file);

        // Allow selecting the same file again
        e.target.value = '';
    };

    /*
    |--------------------------------------------------------------------------
    | Drag & Drop
    |--------------------------------------------------------------------------
    */

    const handleDragOver = (
        e: DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();

        if (!isAuthenticated || limitReached) {
            return;
        }

        setIsDragging(true);
    };

    const handleDragLeave = (
        e: DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();

        setIsDragging(false);
    };

    const handleDrop = (
        e: DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();

        setIsDragging(false);

        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (limitReached) {
            alert(
                'You have reached your PDF upload limit. Please upgrade your plan.'
            );

            return;
        }

        const file = e.dataTransfer.files?.[0];

        if (!file) {
            return;
        }

        handleFileSelect(file);
    };

    /*
    |--------------------------------------------------------------------------
    | Summary generation
    |--------------------------------------------------------------------------
    */

    const [inputMode, setInputMode] = useState<'file' | 'url' | 'compare'>('file');
    const [pdfUrl, setPdfUrl] = useState('');
    const [compareFiles, setCompareFiles] = useState<File[]>([]);
    const [targetLanguage, setTargetLanguage] = useState('uz');
    const compareFileInputRef = useRef<HTMLInputElement | null>(null);

    const handleCompareFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const validPdfs = files.filter(f => f.type === 'application/pdf' && f.size <= 20 * 1024 * 1024);
        if (validPdfs.length !== files.length) {
            alert('Some selected files were not valid PDFs or exceeded 20 MB.');
        }

        setCompareFiles(prev => [...prev, ...validPdfs].slice(0, 3));
        e.target.value = '';
    };

    const removeCompareFile = (index: number) => {
        setCompareFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCompareSubmit = async () => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (limitReached) {
            alert('You have reached your PDF upload limit. Please upgrade your plan.');
            return;
        }

        if (compareFiles.length < 2 || compareFiles.length > 3) {
            alert('Please select between 2 and 3 PDF files to compare.');
            return;
        }

        setLoading(true);
        setProgress(15);
        setSummary('');
        setShowSummary(false);

        const formData = new FormData();
        compareFiles.forEach(file => {
            formData.append('pdfs[]', file, file.name);
        });
        formData.append('target_language', targetLanguage);

        const progressInterval = window.setInterval(() => {
            setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
        }, 400);

        try {
            const response = await fetch('/pdf/compare', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
                body: formData,
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to compare PDFs.');
            }

            const data = await response.json();
            setProgress(100);

            setTimeout(() => {
                setSummary(data.summary);
                setSelectedFile(new File([], `Comparison (${compareFiles.length} docs)`));
                setShowSummary(true);
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (err: any) {
            clearInterval(progressInterval);
            setLoading(false);
            setProgress(0);
            alert(err.message || 'Failed to generate PDF comparison.');
        }
    };

    const handleSummaryTypeSelect = async (
        summaryType: SummaryType,
        targetLanguage: string = 'uz'
    ) => {
        setShowSummaryOptionsModal(false);

        if (!auth?.user) {
            router.visit('/login');
            return;
        }

        if (inputMode === 'url' && !pdfUrl.trim()) {
            alert('Please enter a valid PDF URL.');
            return;
        }

        if (inputMode === 'file' && !selectedFile) {
            alert('Please select a PDF file first.');
            return;
        }

        setLoading(true);
        setProgress(0);
        setSummary('');
        setShowSummary(false);

        const formData = new FormData();

        if (inputMode === 'url' && pdfUrl.trim()) {
            formData.append('pdf_url', pdfUrl.trim());
        } else if (selectedFile) {
            formData.append('pdf', selectedFile, selectedFile.name);
        }

        formData.append('summary_type', summaryType);
        formData.append('target_language', targetLanguage);

        const progressInterval = window.setInterval(() => {
            setProgress((prev) =>
                prev >= 90 ? 90 : prev + 10
            );
        }, 300);

        try {
            /*
             * Laravel CSRF token
             */
            const csrfToken = decodeURIComponent(
                document.cookie
                    .split('; ')
                    .find((row) =>
                        row.startsWith('XSRF-TOKEN=')
                    )
                    ?.split('=')[1] || ''
            );

            const response = await fetch(
                '/pdf/summarize',
                {
                    method: 'POST',

                    headers: {
                        Accept: 'application/json',

                        ...(csrfToken
                            ? {
                                  'X-XSRF-TOKEN':
                                      csrfToken,
                              }
                            : {}),
                    },

                    credentials: 'same-origin',

                    body: formData,
                }
            );

            if (!response.ok) {
                let errorMessage =
                    'Failed to summarize the PDF. Please try again.';

                try {
                    const errorData =
                        await response.json();

                    if (errorData?.message) {
                        errorMessage =
                            errorData.message;
                    }
                } catch {
                    // Ignore invalid JSON response
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();

            setProgress(100);

            let cleanSummary =
                data?.summary || '';

            /*
             * Remove Markdown formatting
             */
            cleanSummary = cleanSummary
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/#+\s/gm, '')
                .replace(/^-\s/gm, '')
                .trim();

            setSummary(cleanSummary);

            window.setTimeout(() => {
                setLoading(false);
                setShowSummary(true);
            }, 500);
        } catch (error) {
            console.error(
                'PDF summarization error:',
                error
            );

            setLoading(false);
            setProgress(0);

            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to summarize the PDF. Please try again.'
            );
        } finally {
            window.clearInterval(
                progressInterval
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | New upload
    |--------------------------------------------------------------------------
    */

    const handleNewUpload = () => {
        setPdf(null);
        setSelectedFile(null);
        setSummary('');

        setProgress(0);
        setLoading(false);

        setShowSummary(false);
        setShowSummaryOptionsModal(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Plan icons
    |--------------------------------------------------------------------------
    */

    const getPlanIcon = (
        planSlug: string
    ) => {
        switch (planSlug) {
            case 'free':
                return (
                    <Zap className="h-5 w-5 text-slate-500" />
                );

            case 'standard':
                return (
                    <Rocket className="h-5 w-5 text-blue-500" />
                );

            case 'premium':
                return (
                    <Sparkles className="h-5 w-5 text-amber-500" />
                );

            default:
                return (
                    <Star className="h-5 w-5 text-slate-500" />
                );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Plan click
    |--------------------------------------------------------------------------
    */

    const handlePlanClick = (
        plan: Plan
    ) => {
        if (plan.slug === 'free') {
            router.visit(
                canRegister
                    ? '/register'
                    : '/login'
            );

            return;
        }

        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        router.visit(
            `/checkout/${plan.slug}`
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Open file picker
    |--------------------------------------------------------------------------
    */

    const openFilePicker = () => {
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        if (limitReached) {
            alert(
                'You have reached your PDF upload limit. Please upgrade your plan.'
            );

            return;
        }

        fileInputRef.current?.click();
    };

    /*
    |--------------------------------------------------------------------------
    | Loading screen
    |--------------------------------------------------------------------------
    */

    if (loading) {
        const currentStep = progress < 30 ? 1 : progress < 65 ? 2 : 3;

        return (
            <>
                <Head title="Generating Summary - PDF Summarizer" />

                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-4">
                    <div className="card-glass glow-violet w-full max-w-lg rounded-3xl p-8 text-center shadow-2xl">

                        {/* Animated Glow Icon */}
                        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30">
                            <Sparkles className="h-10 w-10 animate-pulse" />
                            <span className="absolute -inset-1 animate-ping rounded-3xl bg-violet-500/20" />
                        </div>

                        <h2 className="text-2xl font-black text-white">
                            Synthesizing PDF Intelligence
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Our LLM pipeline is analyzing your document in real-time.
                        </p>

                        {/* 3-Step Stepper */}
                        <div className="mt-8 space-y-3 text-left">
                            {[
                                { step: 1, label: 'Document Validation & Parsing', targetPct: 30 },
                                { step: 2, label: 'Text Extraction & Vector Mapping', targetPct: 65 },
                                { step: 3, label: 'AI Summarization & Study Suite', targetPct: 100 },
                            ].map((s) => {
                                const isDone = progress >= s.targetPct || currentStep > s.step;
                                const isCurrent = currentStep === s.step;

                                return (
                                    <div
                                        key={s.step}
                                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all duration-300 ${
                                            isDone
                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                                : isCurrent
                                                  ? 'border-violet-500/50 bg-violet-500/15 text-white ring-1 ring-violet-500/30'
                                                  : 'border-slate-800 bg-slate-900/40 text-slate-500'
                                        }`}
                                    >
                                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                                            isDone
                                                ? 'bg-emerald-500 text-slate-950'
                                                : isCurrent
                                                  ? 'bg-violet-600 text-white'
                                                  : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {isDone ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : s.step}
                                        </div>

                                        <span className="flex-1 text-sm font-semibold truncate">
                                            {s.label}
                                        </span>

                                        {isCurrent && (
                                            <span className="text-xs font-bold text-violet-400">
                                                {progress}%
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            256-bit Encrypted · Processing in Memory
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="PDF Summarizer - AI-Powered Document Summaries" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">

                {/* Flash message */}
                <FlashMessage
                    flash={
                        flash?.success
                            ? {
                                  type: 'success',
                                  message:
                                      flash.success,
                              }
                            : flash?.error
                              ? {
                                    type: 'error',
                                    message:
                                        flash.error,
                                }
                              : undefined
                    }
                />

                {/* Background decoration */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="absolute -left-40 top-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
                </div>

                {/* Modals */}
                <SummaryOptionsModal
                    show={
                        showSummaryOptionsModal &&
                        !!selectedFile
                    }
                    fileName={
                        selectedFile?.name
                    }
                    userPlanSlug={
                        userPlanSlug
                    }
                    onClose={() =>
                        setShowSummaryOptionsModal(
                            false
                        )
                    }
                    onSelect={
                        handleSummaryTypeSelect
                    }
                />

                <SummaryModal
                    show={
                        showSummary &&
                        !!summary
                    }
                    summary={summary}
                    filename={
                        selectedFile?.name ||
                        pdf?.name ||
                        'Document'
                    }
                    onClose={() =>
                        setShowSummary(false)
                    }
                    onNewUpload={
                        handleNewUpload
                    }
                />

                {/* Navbar */}
                <nav className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">

                            {/* Logo */}
                            <Link
                                href="/"
                                className="flex items-center gap-3"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>

                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    PDF Summarizer
                                </span>
                            </Link>

                            {/* Navigation */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            href="/history"
                                            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:block"
                                        >
                                            History
                                        </Link>

                                        <Link
                                            href="/dashboard"
                                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                        >
                                            Dashboard
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Login
                                        </Link>

                                        {canRegister && (
                                            <Link
                                                href="/register"
                                                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                                            >
                                                Get Started
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <main className="relative z-10 pt-16">

                    <section className="px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
                        <div
                            className={`mx-auto max-w-5xl text-center transition-all duration-1000 ${
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-4 opacity-0'
                            }`}
                        >
                            {/* Badges & Trust Strip */}
                            <div className="mb-7 flex flex-wrap items-center justify-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-4 py-2 text-xs font-bold text-violet-700 backdrop-blur-md dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    AI-Powered LLM Suite
                                </span>

                                {/* Trust Strip with Counter & Avatars */}
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                                    <div className="flex -space-x-1.5">
                                        {['avatar1', 'avatar2', 'avatar3', 'avatar4'].map((_, idx) => (
                                            <div
                                                key={idx}
                                                className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900"
                                            >
                                                {['A', 'S', 'M', 'K'][idx]}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                        <span className="font-bold text-slate-900 dark:text-white">4.9/5</span>
                                    </div>
                                    <span className="text-slate-400">·</span>
                                    <AnimatedCounter
                                        target={50000}
                                        suffix="+"
                                        className="font-bold text-violet-600 dark:text-violet-400"
                                    />
                                    <span>pages summarized</span>
                                </div>
                            </div>

                            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                                Turn long PDFs into
                                <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    powerful summaries
                                </span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
                                Upload your PDF and let AI extract key insights in seconds. Choose your study style with interactive flashcards, quizzes, and side-by-side translation.
                            </p>

                            {/* Upload card & Mode Switcher */}
                            <div className="mx-auto mt-10 max-w-3xl">
                                {/* Mode Switcher Tabs */}
                                <div className="mb-6 inline-flex rounded-2xl bg-slate-200/70 p-1.5 backdrop-blur-md dark:bg-slate-800/70">
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('file')}
                                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                                            inputMode === 'file'
                                                ? 'bg-white text-violet-600 shadow-md dark:bg-slate-900 dark:text-violet-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Upload PDF File
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setInputMode('url')}
                                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                                            inputMode === 'url'
                                                ? 'bg-white text-indigo-600 shadow-md dark:bg-slate-900 dark:text-indigo-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <Globe className="h-4 w-4" />
                                        Paste PDF Link (URL)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setInputMode('compare')}
                                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                                            inputMode === 'compare'
                                                ? 'bg-white text-purple-600 shadow-md dark:bg-slate-900 dark:text-purple-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <GitCompare className="h-4 w-4" />
                                        Compare 2-3 PDFs ⚔️
                                    </button>
                                </div>

                                {inputMode === 'file' ? (
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={openFilePicker}
                                        className={`
                                            group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-8 transition-all duration-300 sm:p-12
                                            ${
                                                isDragging
                                                    ? 'scale-[1.01] border-violet-500 bg-violet-50/80 glow-violet dark:bg-violet-500/10'
                                                    : 'card-glass border-slate-300/80 hover:border-violet-400 hover:shadow-xl dark:border-slate-700/80 dark:hover:border-violet-500'
                                            }
                                            ${limitReached ? 'cursor-not-allowed opacity-70' : ''}
                                        `}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        {/* Upload Icon with Orbit Animation */}
                                        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-100 to-indigo-100 transition-transform duration-300 group-hover:scale-110 dark:from-violet-500/20 dark:to-indigo-500/20">
                                            <Upload className="h-9 w-9 text-violet-600 dark:text-violet-400" />
                                            <span className="animate-orbit absolute h-2 w-2 rounded-full bg-violet-500" />
                                        </div>

                                        <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
                                            {limitReached ? 'Upload limit reached' : 'Upload your PDF'}
                                        </h2>

                                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                                            {limitReached
                                                ? 'Upgrade your plan to upload more documents.'
                                                : 'Drag and drop your PDF here, or click to browse from your device.'}
                                        </p>

                                        {!limitReached && (
                                            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition group-hover:from-violet-700 group-hover:to-indigo-700">
                                                <FileText className="h-4 w-4" />
                                                Choose PDF Document
                                            </div>
                                        )}

                                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                PDF format
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                Up to 20 MB
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <Lock className="h-3.5 w-3.5 text-indigo-400" />
                                                256-bit SSL Encrypted
                                            </span>
                                        </div>
                                    </div>
                                ) : inputMode === 'url' ? (
                                    <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-12">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/10">
                                            <Globe className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                        </div>

                                        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                                            Paste Direct PDF Link (URL)
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Paste any public web link ending in .pdf to summarize it without downloading
                                        </p>

                                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                            <input
                                                type="url"
                                                value={pdfUrl}
                                                onChange={(e) => setPdfUrl(e.target.value)}
                                                placeholder="https://example.com/document.pdf"
                                                className="w-full flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!isAuthenticated) {
                                                        router.visit('/login');
                                                        return;
                                                    }
                                                    if (limitReached) {
                                                        alert('You have reached your upload limit. Please upgrade your plan.');
                                                        return;
                                                    }
                                                    if (!pdfUrl.trim() || !pdfUrl.startsWith('http')) {
                                                        alert('Please enter a valid HTTP/HTTPS PDF URL.');
                                                        return;
                                                    }
                                                    setShowSummaryOptionsModal(true);
                                                }}
                                                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-violet-700 hover:to-indigo-700"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                Summarize Link
                                            </button>
                                        </div>

                                        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                Direct PDF URL
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                Auto Language Target
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <Lock className="h-3.5 w-3.5" />
                                                Instant fetch
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-3xl border border-purple-200 bg-white/90 p-8 shadow-xl dark:border-purple-500/30 dark:bg-slate-900/80 sm:p-10">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-500/10">
                                            <GitCompare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                        </div>

                                        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                                            Multi-PDF Comparison & Synthesizer
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Upload 2 or 3 PDF documents to generate side-by-side matrices, shared points, and differences.
                                        </p>

                                        {/* Selected files list */}
                                        <div className="mt-6 flex flex-col gap-2.5">
                                            {compareFiles.length === 0 ? (
                                                <p className="py-4 text-xs font-semibold text-slate-400">
                                                    No PDFs selected yet. Click below to pick 2 or 3 PDF files.
                                                </p>
                                            ) : (
                                                compareFiles.map((file, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between rounded-xl border border-purple-200/80 bg-purple-50/50 px-4 py-3 text-sm font-medium text-slate-800 dark:border-purple-500/30 dark:bg-purple-950/20 dark:text-slate-200"
                                                    >
                                                        <div className="flex items-center gap-2.5 truncate">
                                                            <FileText className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                                                            <span className="truncate">Doc #{idx + 1}: {file.name}</span>
                                                            <span className="text-xs text-slate-400">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeCompareFile(idx)}
                                                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <input
                                            ref={compareFileInputRef}
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            multiple
                                            onChange={handleCompareFilesChange}
                                            className="hidden"
                                        />

                                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                            {compareFiles.length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => compareFileInputRef.current?.click()}
                                                    className="flex items-center gap-2 rounded-xl border border-dashed border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-500/40 dark:bg-purple-950/30 dark:text-purple-300"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add PDF ({compareFiles.length}/3)
                                                </button>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-slate-500">Language:</span>
                                                <select
                                                    value={targetLanguage}
                                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                >
                                                    <option value="uz">O'zbekcha 🇺🇿</option>
                                                    <option value="en">English 🇬🇧</option>
                                                    <option value="ru">Русский 🇷🇺</option>
                                                    <option value="de">Deutsch 🇩🇪</option>
                                                    <option value="es">Español 🇪🇸</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleCompareSubmit}
                                            disabled={compareFiles.length < 2 || loading}
                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            <GitCompare className="h-4 w-4" />
                                            {loading ? 'Comparing Documents...' : `Compare ${compareFiles.length} PDFs`}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* User stats */}
                            {isAuthenticated &&
                                userStats && (
                                    <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                                        <div className="flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                Monthly PDF usage
                                            </span>

                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {userStats.pdfCount}{' '}
                                                /{' '}
                                                {userStats.pdfLimit}
                                            </span>
                                        </div>

                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        userStats.pdfLimit > 0
                                                            ? (userStats.pdfCount /
                                                                  userStats.pdfLimit) *
                                                                  100
                                                            : 0
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                        </div>
                    </section>

                    {/* Features */}
                    <section className="border-y border-slate-200/70 bg-white/60 px-4 py-16 dark:border-slate-800 dark:bg-slate-900/30 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-6xl">
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
                                        <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>

                                    <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
                                        AI-Powered
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Get meaningful summaries generated by advanced AI.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/10">
                                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>

                                    <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
                                        Save Time
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Understand long documents without reading every page.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>

                                    <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
                                        Simple & Secure
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        A clean workflow designed for fast and secure document processing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pricing */}
                    {safePlans.length > 0 && (
                        <section className="px-4 py-20 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-6xl">

                                <div className="mx-auto mb-12 max-w-2xl text-center">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Simple pricing
                                    </span>

                                    <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
                                        Choose the plan that works for you
                                    </h2>

                                    <p className="mt-4 text-slate-500 dark:text-slate-400">
                                        Start free and upgrade when you need more power.
                                    </p>

                                    {/* Monthly / Yearly Toggle */}
                                    <div className="mt-6 flex justify-center">
                                        <PricingToggle onChange={setBillingPeriod} />
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-3">
                                    {safePlans.map(
                                        (plan) => {
                                            const isCurrent =
                                                plan.slug ===
                                                userPlanSlug;

                                            const isPopular =
                                                plan.slug ===
                                                'standard';

                                            const displayPrice = billingPeriod === 'yearly'
                                                ? (Number(plan.price) * 0.83).toFixed(2)
                                                : Number(plan.price).toFixed(2);

                                            return (
                                                <div
                                                    key={
                                                        plan.id
                                                    }
                                                    className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 ${
                                                        isPopular
                                                            ? 'border-violet-500 ring-2 ring-violet-500/10'
                                                            : 'border-slate-200 dark:border-slate-800'
                                                    }`}
                                                >
                                                    {isPopular && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                            <span className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                                                                Most Popular
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                                            {getPlanIcon(
                                                                plan.slug
                                                            )}
                                                        </div>

                                                        {isCurrent && (
                                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                                                        {plan.name}
                                                    </h3>

                                                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                        {
                                                            plan.description
                                                        }
                                                    </p>

                                                    <div className="mt-6 flex items-end gap-1">
                                                        <span className="text-4xl font-black text-slate-900 dark:text-white">
                                                            ${displayPrice}
                                                        </span>

                                                        <span className="pb-1 text-sm text-slate-400">
                                                            / month
                                                        </span>
                                                    </div>

                                                    <div className="my-6 h-px bg-slate-200 dark:bg-slate-800" />

                                                    <div className="mb-5 text-sm font-semibold text-slate-900 dark:text-white">
                                                        {plan.pdf_limit}{' '}
                                                        PDFs / month
                                                    </div>

                                                    <div className="flex-1 space-y-3">
                                                        {plan.features.map(
                                                            (
                                                                feature,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        index
                                                                    }
                                                                    className="flex items-start gap-2.5"
                                                                >
                                                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                                                                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                                    </div>

                                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                        {
                                                                            feature
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePlanClick(
                                                                plan
                                                            )
                                                        }
                                                        disabled={
                                                            isCurrent
                                                        }
                                                        className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                                                            isCurrent
                                                                ? 'cursor-default bg-slate-100 text-slate-400 dark:bg-slate-800'
                                                                : isPopular
                                                                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                                                                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {isCurrent
                                                            ? 'Current Plan'
                                                            : plan.slug ===
                                                                'free'
                                                              ? 'Get Started'
                                                              : 'Choose Plan'}

                                                        {!isCurrent && (
                                                            <ArrowRight className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* CTA */}
                    <section className="px-4 pb-20 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-12 text-center shadow-2xl shadow-violet-500/20 sm:px-12">
                            <Sparkles className="mx-auto h-8 w-8 text-white/90" />

                            <h2 className="mt-4 text-3xl font-black text-white">
                                Ready to summarize your documents?
                            </h2>

                            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
                                Upload your first PDF and see how quickly AI can turn it into a useful summary.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    openFilePicker
                                }
                                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-slate-50"
                            >
                                Start Summarizing
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200 bg-white/60 px-4 py-8 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6 lg:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>

                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                PDF Summarizer
                            </span>
                        </div>

                        <p className="text-xs text-slate-400">
                            © {new Date().getFullYear()} PDF Summarizer. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}