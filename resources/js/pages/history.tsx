import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    FileText,
    Inbox,
    Loader2,
    Sparkles,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'History',
        href: '/history',
    },
];

interface Summary {
    id: number;
    filename: string;
    summary: string;
    created_at: string;
    pdf_id: number;
    user_id: number;
}

interface Props {
    summaries: {
        data: Summary[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function downloadAsText(summary: Summary): void {
    const element = document.createElement('a');
    const file = new Blob([summary.summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${summary.filename.replace('.pdf', '')}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
}

async function exportAsPdf(summary: Summary): Promise<void> {
    const exportContainer = document.createElement('div');
    exportContainer.setAttribute('data-export-container', 'true');
    exportContainer.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: 800px;
        z-index: -1;
        background-color: #fff;
    `;

    exportContainer.innerHTML = `
        <div style="padding: 32px; background-color: #ffffff; font-family: Arial, sans-serif;">
            <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="font-size: 24px; font-weight: bold; color: #000000; margin-bottom: 8px; margin-top: 0;">
                    Summary
                </h3>
                <p style="font-size: 14px; color: #333333; margin: 0 0 4px 0;">
                    ${summary.filename}
                </p>
                <p style="font-size: 12px; color: #666666; margin: 0;">
                    ${formatDate(summary.created_at)}
                </p>
            </div>
            <div style="color: #000000; line-height: 1.75;">
                ${summary.summary
                    .split('\n')
                    .map((paragraph) => `<p style="font-size: 16px; margin-bottom: 16px; margin-top: 0;">${paragraph}</p>`)
                    .join('')}
            </div>
        </div>
    `;

    document.body.appendChild(exportContainer);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#fff',
            logging: false,
            windowWidth: 800,
            onclone: (cloneDoc) => {
                const styleSheets = cloneDoc.querySelectorAll('link[rel="stylesheet"], style');
                styleSheets.forEach((sheet) => sheet.remove());
            },
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, Math.min(heightLeft, pageHeight));
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`${summary.filename.replace('.pdf', '')}_summary.pdf`);
    } finally {
        document.body.removeChild(exportContainer);
    }
}

/* -------------------------------------------------------------------------- */
/*  Small reusable pieces                                                      */
/* -------------------------------------------------------------------------- */

function SummaryCard({
    summary,
    isExporting,
    onExport,
}: {
    summary: Summary;
    isExporting: boolean;
    onExport: () => void;
}) {
    return (
        <details className="group overflow-hidden rounded-3xl border border-violet-100 bg-white/80 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 dark:border-white/10 dark:bg-white/5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-6 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-violet-600/20">
                        <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {summary.filename}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatDate(summary.created_at)}
                        </p>
                    </div>
                </div>
                <ChevronDown
                    className="h-4 w-4 flex-none text-violet-500 transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                />
            </summary>

            <div className="border-t border-violet-100 px-6 pb-6 pt-4 dark:border-white/10">
                <p className="line-clamp-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {summary.summary}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => downloadAsText(summary)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-violet-600 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-violet-400 dark:hover:bg-white/10"
                    >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Download .txt
                    </button>

                    <button
                        type="button"
                        onClick={onExport}
                        disabled={isExporting}
                        aria-busy={isExporting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/20 outline-none transition-all hover:scale-[1.02] hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                Exporting&hellip;
                            </>
                        ) : (
                            <>
                                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                Export as PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </details>
    );
}

function Pagination({
    currentPage,
    lastPage,
    onNavigate,
}: {
    currentPage: number;
    lastPage: number;
    onNavigate: (page: number) => void;
}) {
    return (
        <nav className="flex items-center justify-between gap-4 pt-2" aria-label="History pagination">
            <button
                type="button"
                onClick={() => onNavigate(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Previous
            </button>

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Page {currentPage} of {lastPage}
            </p>

            <button
                type="button"
                onClick={() => onNavigate(currentPage + 1)}
                disabled={currentPage >= lastPage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
        </nav>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function History({ summaries }: Props) {
    const [exportingId, setExportingId] = useState<number | null>(null);

    const isEmpty = summaries.data.length === 0;

    const goToPage = (page: number) => {
        if (page < 1 || page > summaries.last_page) return;
        router.get(
            '/history',
            { page },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleExport = async (summary: Summary) => {
        if (exportingId !== null) return;
        setExportingId(summary.id);
        try {
            await exportAsPdf(summary);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setExportingId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Summary history
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {summaries.total} summar{summaries.total === 1 ? 'y' : 'ies'} generated so far
                        </p>
                    </div>
                </div>

                {isEmpty ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-violet-100 bg-white/80 p-12 text-center shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Inbox className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                            No summaries yet
                        </h2>
                        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            Once you summarize a PDF, it will show up here so you can revisit, download, or
                            export it anytime.
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] hover:bg-violet-700 hover:shadow-violet-600/40 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 outline-none"
                        >
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Summarize a PDF
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {summaries.data.map((summary) => (
                                <SummaryCard
                                    key={summary.id}
                                    summary={summary}
                                    isExporting={exportingId === summary.id}
                                    onExport={() => handleExport(summary)}
                                />
                            ))}
                        </div>

                        {summaries.last_page > 1 && (
                            <Pagination
                                currentPage={summaries.current_page}
                                lastPage={summaries.last_page}
                                onNavigate={goToPage}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}