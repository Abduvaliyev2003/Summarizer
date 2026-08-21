import { Pagination } from '@/components/ui/pagination';
import { SectionCard } from '@/components/ui/section-card';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';
import { BreadcrumbItem, PaginatedResponse, PdfSummary } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Calendar, ChevronDown, Copy, Check, Download, ExternalLink, FileText, Inbox, Loader2, MessageSquare, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import PdfChatModal from '@/components/PdfChatModal';

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

interface Props {
    summaries: PaginatedResponse<PdfSummary>;
}

function downloadAsText(summary: PdfSummary): void {
    const element = document.createElement('a');
    const file = new Blob([summary.summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${summary.filename.replace('.pdf', '')}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function exportAsPdf(summary: PdfSummary): Promise<void> {
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
                    ${escapeHtml(summary.filename)}
                </p>
                <p style="font-size: 12px; color: #666666; margin: 0;">
                    ${escapeHtml(formatDateTime(summary.created_at))}
                </p>
            </div>
            <div style="color: #000000; line-height: 1.75;">
                ${summary.summary
                    .split('\n')
                    .map((paragraph) => `<p style="font-size: 16px; margin-bottom: 16px; margin-top: 0;">${escapeHtml(paragraph)}</p>`)
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

function SummaryCard({ summary }: { summary: PdfSummary }) {
    const [expanded, setExpanded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'txt' | 'pdf'>('txt');
    const [isShared, setIsShared] = useState(summary.is_shared ?? false);
    const [shareUrl, setShareUrl] = useState<string | null>(
        summary.share_token ? `${window.location.origin}/s/${summary.share_token}` : null
    );
    const [isSharing, setIsSharing] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const response = await fetch(`/history/${summary.id}/share`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
            });
            const data = await response.json();
            setIsShared(data.shared);
            setShareUrl(data.share_url ?? null);
        } finally {
            setIsSharing(false);
        }
    };

    const handleCopyLink = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    const handleExport = async (format: 'txt' | 'pdf') => {
        setIsExporting(true);
        setExportFormat(format);
        try {
            if (format === 'txt') {
                downloadAsText(summary);
            } else {
                await exportAsPdf(summary);
            }
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <SectionCard className="p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {summary.filename}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDateTime(summary.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleExport('txt')}
                        disabled={isExporting}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        {isExporting && exportFormat === 'txt' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Download className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        )}
                        <span>TXT</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        {isExporting && exportFormat === 'pdf' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span>PDF</span>
                    </button>

                    {/* Share button */}
                    <button
                        type="button"
                        onClick={handleShare}
                        disabled={isSharing}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all ${
                            isShared
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                    >
                        {isSharing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Share2 className="h-3.5 w-3.5" />
                        )}
                        <span>{isShared ? 'Shared ✓' : 'Share'}</span>
                    </button>

                    {/* Copy link & open link when shared */}
                    {isShared && shareUrl && (
                        <>
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
                            >
                                {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                {linkCopied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <a
                                href={shareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open
                            </a>
                        </>
                    )}
                    {/* Chat with PDF button */}
                    <button
                        type="button"
                        onClick={() => setShowChat(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-xs transition-all hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                    </button>
                </div>
            </div>

            <PdfChatModal
                show={showChat}
                summary={summary.summary}
                summaryId={summary.id}
                filename={summary.filename}
                onClose={() => setShowChat(false)}
            />

            <div className="mt-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-white/5">
                <p className={`text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${expanded ? '' : 'line-clamp-3'}`}>
                    {summary.summary}
                </p>
                {summary.summary.length > 180 && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline dark:text-violet-400"
                    >
                        <span>{expanded ? 'Show less' : 'Read full summary'}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
        </SectionCard>
    );
}

export default function History({ summaries }: Props) {
    const handlePageChange = (page: number) => {
        router.get('/history', { page }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History - PDF Summarizer" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Summary History
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Access and export all your past AI-generated document summaries
                        </p>
                    </div>
                </div>

                {summaries.data.length === 0 ? (
                    <SectionCard className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                            <Inbox className="h-7 w-7" />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                            No summaries yet
                        </h2>
                        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                            Upload a PDF document to generate your first AI summary.
                        </p>
                        <Link
                            href="/"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:scale-105"
                        >
                            <Sparkles className="h-4 w-4" />
                            Summarize PDF Now
                        </Link>
                    </SectionCard>
                ) : (
                    <div className="space-y-4">
                        {summaries.data.map((summary) => (
                            <SummaryCard key={summary.id} summary={summary} />
                        ))}

                        <Pagination
                            currentPage={summaries.current_page}
                            lastPage={summaries.last_page}
                            total={summaries.total}
                            perPage={summaries.per_page}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
