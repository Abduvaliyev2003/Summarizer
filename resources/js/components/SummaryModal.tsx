import { X, CheckCircle2, Copy, Download, FileText, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';
import StudySuiteViewer from '@/components/StudySuiteViewer';
import PdfComparisonViewer from '@/components/PdfComparisonViewer';
import PdfChatModal from '@/components/PdfChatModal';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SummaryModalProps {
    show: boolean;
    summary: string;
    filename: string;
    onClose: () => void;
    onNewUpload: () => void;
}

export default function SummaryModal({
    show,
    summary,
    filename,
    onClose,
    onNewUpload,
}: SummaryModalProps) {
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [displaySummary, setDisplaySummary] = useState(summary);
    const [isRewriting, setIsRewriting] = useState(false);
    const [activeMode, setActiveMode] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        setDisplaySummary(summary);
    }, [summary]);

    const summaryRef = useRef<HTMLDivElement>(null);

    if (!show || !summary) {
        return null;
    }

    const handleRewrite = async (mode: 'simpler' | 'professional' | 'shorter' | 'bullets') => {
        setIsRewriting(true);
        setActiveMode(mode);
        try {
            const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const response = await fetch('/pdf/rewrite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    summary: displaySummary,
                    mode,
                }),
            });
            const data = await response.json();
            if (response.ok && data.summary) {
                setDisplaySummary(data.summary);
            } else {
                alert(data.message || 'Failed to rewrite summary. Please try again.');
            }
        } catch (e: any) {
            console.error('Failed to rewrite summary:', e);
            alert(e.message || 'Failed to rewrite summary.');
        } finally {
            setIsRewriting(false);
            setActiveMode(null);
        }
    };

    // Copy summary
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(displaySummary);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy summary:', error);
        }
    };

    // Download TXT
    const handleDownload = () => {
        const fileName =
            filename?.replace(/\.pdf$/i, '') || 'summary';

        const blob = new Blob([displaySummary], {
            type: 'text/plain;charset=utf-8',
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}_summary.txt`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    // Export PDF
    const handleExportPDF = async () => {
        if (!summaryRef.current || exporting) {
            return;
        }

        setExporting(true);

        let exportContainer: HTMLDivElement | null = null;

        try {
            const fileName =
                filename?.replace(/\.pdf$/i, '') || 'summary';

            // Create temporary PDF container
            exportContainer = document.createElement('div');

            exportContainer.style.position = 'fixed';
            exportContainer.style.left = '-99999px';
            exportContainer.style.top = '0';
            exportContainer.style.width = '794px';
            exportContainer.style.backgroundColor = '#ffffff';
            exportContainer.style.padding = '48px';
            exportContainer.style.fontFamily = 'Arial, sans-serif';
            exportContainer.style.color = '#334155';
            exportContainer.style.boxSizing = 'border-box';

            // Header
            const header = document.createElement('div');

            header.innerHTML = `
                <h1 style="
                    font-size: 28px;
                    font-weight: 700;
                    color: #111827;
                    margin: 0 0 8px 0;
                ">
                    Summary
                </h1>

                <p style="
                    font-size: 14px;
                    color: #64748b;
                    margin: 0 0 32px 0;
                ">
                    ${escapeHtml(filename)}
                </p>
            `;

            exportContainer.appendChild(header);

            // Summary content
            const content = document.createElement('div');

            displaySummary.split('\n').forEach((line) => {
                const paragraph = document.createElement('p');

                paragraph.textContent = line || '\u00A0';

                paragraph.style.fontSize = '16px';
                paragraph.style.lineHeight = '1.7';
                paragraph.style.color = '#334155';
                paragraph.style.margin = '0 0 14px 0';

                content.appendChild(paragraph);
            });

            exportContainer.appendChild(content);

            document.body.appendChild(exportContainer);

            // Wait for browser rendering
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });

            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = 210;
            const pageHeight = 297;

            const margin = 10;

            const contentWidth = pageWidth - margin * 2;

            const imageHeight =
                (canvas.height * contentWidth) / canvas.width;

            let heightLeft = imageHeight;
            let position = margin;

            // First page
            pdf.addImage(
                imgData,
                'PNG',
                margin,
                position,
                contentWidth,
                imageHeight
            );

            heightLeft -= pageHeight - margin * 2;

            // Additional pages
            while (heightLeft > 0) {
                position =
                    heightLeft -
                    imageHeight +
                    margin;

                pdf.addPage();

                pdf.addImage(
                    imgData,
                    'PNG',
                    margin,
                    position,
                    contentWidth,
                    imageHeight
                );

                heightLeft -= pageHeight - margin * 2;
            }

            pdf.save(`${fileName}_summary.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            if (exportContainer) {
                exportContainer.remove();
            }

            setExporting(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="summary-modal-title"
            >
                {/* everything from line 269 to 503 unchanged */}
                <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 sm:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>

                            <div className="min-w-0">
                                <h2
                                    id="summary-modal-title"
                                    className="text-lg font-semibold text-white"
                                >
                                    Summary Generated
                                </h2>

                                <p className="truncate text-sm text-white/75">
                                    {filename || 'Document'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Close summary"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-8">
                        <div
                            ref={summaryRef}
                            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                        >
                            <div className="mb-6 border-b border-slate-200 pb-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="mb-1 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-violet-600" />
                                            <h3 className="text-xl font-semibold text-slate-900">
                                                {displaySummary.includes('=== COMPARATIVE MATRIX ===')
                                                    ? '⚔️ Multi-PDF Comparison Matrix'
                                                    : displaySummary.includes('=== FLASHCARDS ===') || displaySummary.includes('=== EXAM QUIZ ===')
                                                    ? '🎓 Student Study Suite'
                                                    : 'Summary'}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {filename || 'Document'}
                                        </p>
                                    </div>

                                    {/* AI Rewrite Action Toolbar */}
                                    {!displaySummary.includes('=== COMPARATIVE MATRIX ===') &&
                                     !displaySummary.includes('=== FLASHCARDS ===') && (
                                        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-violet-600 px-2">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Rewrite:
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleRewrite('simpler')}
                                                disabled={isRewriting}
                                                className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                                    activeMode === 'simpler'
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {isRewriting && activeMode === 'simpler' ? (
                                                    <Loader2 className="h-3 w-3 animate-spin inline" />
                                                ) : (
                                                    '🐣 Simpler'
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRewrite('professional')}
                                                disabled={isRewriting}
                                                className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                                    activeMode === 'professional'
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {isRewriting && activeMode === 'professional' ? (
                                                    <Loader2 className="h-3 w-3 animate-spin inline" />
                                                ) : (
                                                    '💼 Professional'
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRewrite('shorter')}
                                                disabled={isRewriting}
                                                className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                                    activeMode === 'shorter'
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {isRewriting && activeMode === 'shorter' ? (
                                                    <Loader2 className="h-3 w-3 animate-spin inline" />
                                                ) : (
                                                    '⚡ Shorter'
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRewrite('bullets')}
                                                disabled={isRewriting}
                                                className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                                    activeMode === 'bullets'
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {isRewriting && activeMode === 'bullets' ? (
                                                    <Loader2 className="h-3 w-3 animate-spin inline" />
                                                ) : (
                                                    '📋 Bullets'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {displaySummary.includes('=== COMPARATIVE MATRIX ===') ? (
                                <PdfComparisonViewer rawContent={displaySummary} />
                            ) : displaySummary.includes('=== FLASHCARDS ===') || displaySummary.includes('=== EXAM QUIZ ===') || displaySummary.includes('=== KEY CONCEPTS ===') ? (
                                <StudySuiteViewer rawContent={displaySummary} />
                            ) : (
                                <div className="space-y-3">
                                    {displaySummary.split('\n').map((line, index) => (
                                        <p
                                            key={index}
                                            className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700"
                                        >
                                            {line || '\u00A0'}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 flex-col gap-4 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">

                        {/* Export actions */}
                        <div className="flex flex-wrap gap-2">
                            {/* Copy */}
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </button>

                            {/* TXT Download */}
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            >
                                <Download className="h-4 w-4" />
                                Download TXT
                            </button>

                            {/* PDF */}
                            <button
                                type="button"
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            >
                                <FileText className="h-4 w-4" />

                                {exporting
                                    ? 'Exporting...'
                                    : 'Export as PDF'}
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setShowChat(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Chat with PDF
                            </button>

                            <button
                                type="button"
                                onClick={onNewUpload}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                New Upload
                            </button>

                            <Link
                                href="/history"
                                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                View History
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <PdfChatModal
                show={showChat}
                summary={displaySummary}
                filename={filename}
                onClose={() => setShowChat(false)}
            />
        </>
    );
}

/**
 * Escape text before inserting it into HTML.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}