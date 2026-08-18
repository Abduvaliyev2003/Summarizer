import { X, CheckCircle2, Copy, Download, FileText, Sparkles, Loader2, MessageSquare, Globe } from 'lucide-react';
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

const DUAL_LANGUAGES = [
    { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

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

    // Side-by-Side Dual View states
    const [showDualView, setShowDualView] = useState(false);
    const [dualTargetLang, setDualTargetLang] = useState('uz');
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Synchronized scrolling refs
    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const isSyncingScroll = useRef(false);

    const handleLeftScroll = () => {
        if (isSyncingScroll.current) return;
        if (leftScrollRef.current && rightScrollRef.current) {
            isSyncingScroll.current = true;
            const percentage =
                leftScrollRef.current.scrollTop /
                (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight || 1);
            rightScrollRef.current.scrollTop =
                percentage * (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight);
            setTimeout(() => {
                isSyncingScroll.current = false;
            }, 50);
        }
    };

    const handleRightScroll = () => {
        if (isSyncingScroll.current) return;
        if (leftScrollRef.current && rightScrollRef.current) {
            isSyncingScroll.current = true;
            const percentage =
                rightScrollRef.current.scrollTop /
                (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight || 1);
            leftScrollRef.current.scrollTop =
                percentage * (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
            setTimeout(() => {
                isSyncingScroll.current = false;
            }, 50);
        }
    };

    useEffect(() => {
        setDisplaySummary(summary);
        setTranslatedText(null);
        setShowDualView(false);
    }, [summary]);

    // Keyboard shortcut to close on Escape
    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, onClose]);

    const handleFetchDualTranslation = async (lang: string) => {
        setIsTranslating(true);
        setDualTargetLang(lang);
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
                    mode: 'translate',
                    target_language: lang,
                }),
            });
            const data = await response.json();
            if (response.ok && data.summary) {
                setTranslatedText(data.summary);
            } else {
                setTranslatedText('Failed to generate translation. Please try again.');
            }
        } catch {
            setTranslatedText('Error generating translation. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    };

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
        const fileName = filename?.replace(/\.pdf$/i, '') || 'summary';
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
            const fileName = filename?.replace(/\.pdf$/i, '') || 'summary';
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

            const header = document.createElement('div');
            header.innerHTML = `
                <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">Summary</h1>
                <p style="font-size: 14px; color: #64748b; margin: 0 0 32px 0;">${escapeHtml(filename)}</p>
            `;
            exportContainer.appendChild(header);

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
            const imageHeight = (canvas.height * contentWidth) / canvas.width;
            let heightLeft = imageHeight;
            let position = margin;

            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imageHeight);
            heightLeft -= pageHeight - margin * 2;

            while (heightLeft > 0) {
                position = heightLeft - imageHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imageHeight);
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity duration-300"
                role="dialog"
                aria-modal="true"
                aria-labelledby="summary-modal-title"
            >
                <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                    {/* Header */}
                    <div className="animate-gradient-x flex shrink-0 items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-[length:200%_100%] px-6 py-5 sm:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>

                            <div className="min-w-0">
                                <h2
                                    id="summary-modal-title"
                                    className="text-lg font-bold text-white"
                                >
                                    Summary Generated
                                </h2>

                                <p className="truncate text-sm text-white/80">
                                    {filename || 'Document'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1 font-mono text-xs font-semibold text-white/90 backdrop-blur-sm border border-white/15">
                                Esc
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl p-2 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                                aria-label="Close summary"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/50 sm:p-8">
                        <div
                            ref={summaryRef}
                            className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            {/* Shimmer skeleton overlay during AI rewriting */}
                            {isRewriting && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
                                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>AI is rewriting your summary ({activeMode})...</span>
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 border-b border-slate-200 pb-5 dark:border-slate-800">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="mb-1 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                {displaySummary.includes('=== COMPARATIVE MATRIX ===')
                                                    ? '⚔️ Multi-PDF Comparison Matrix'
                                                    : displaySummary.includes('=== FLASHCARDS ===') || displaySummary.includes('=== EXAM QUIZ ===')
                                                    ? '🎓 Student Study Suite'
                                                    : 'Summary'}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {filename || 'Document'}
                                        </p>
                                    </div>

                                    {/* AI Rewrite Action Toolbar */}
                                    {!displaySummary.includes('=== COMPARATIVE MATRIX ===') &&
                                     !displaySummary.includes('=== FLASHCARDS ===') && (
                                        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/80">
                                            <span className="flex items-center gap-1 px-2 text-[11px] font-bold text-violet-600 dark:text-violet-400">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Rewrite:
                                            </span>

                                            {[
                                                { mode: 'simpler', label: '🐣 Simpler' },
                                                { mode: 'professional', label: '💼 Professional' },
                                                { mode: 'shorter', label: '⚡ Shorter' },
                                                { mode: 'bullets', label: '📋 Bullets' },
                                            ].map((btn) => (
                                                <button
                                                    key={btn.mode}
                                                    type="button"
                                                    onClick={() => handleRewrite(btn.mode as any)}
                                                    disabled={isRewriting}
                                                    className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                                        activeMode === btn.mode
                                                            ? 'bg-violet-600 text-white shadow-sm'
                                                            : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                                                    }`}
                                                >
                                                    {isRewriting && activeMode === btn.mode ? (
                                                        <Loader2 className="inline h-3 w-3 animate-spin" />
                                                    ) : (
                                                        btn.label
                                                    )}
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const nextState = !showDualView;
                                                    setShowDualView(nextState);
                                                    if (nextState && !translatedText) {
                                                        handleFetchDualTranslation(dualTargetLang);
                                                    }
                                                }}
                                                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                                    showDualView
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300'
                                                }`}
                                            >
                                                <Globe className="h-3 w-3" />
                                                {showDualView ? 'Single View' : '🌐 Dual View'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {displaySummary.includes('=== COMPARATIVE MATRIX ===') ? (
                                <PdfComparisonViewer rawContent={displaySummary} />
                            ) : displaySummary.includes('=== FLASHCARDS ===') || displaySummary.includes('=== EXAM QUIZ ===') || displaySummary.includes('=== KEY CONCEPTS ===') ? (
                                <StudySuiteViewer rawContent={displaySummary} />
                            ) : showDualView ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Left Column: Original Summary */}
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                                Original Summary
                                            </span>
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                Primary
                                            </span>
                                        </div>
                                        <div
                                            ref={leftScrollRef}
                                            onScroll={handleLeftScroll}
                                            className="max-h-[50vh] space-y-3 overflow-y-auto pr-1"
                                        >
                                            {displaySummary.split('\n').map((line, index) => (
                                                <p key={index} className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                    {line || '\u00A0'}
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column: Side-by-Side Dual Translation */}
                                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-5 dark:border-indigo-900/50 dark:bg-slate-900/50">
                                        <div className="mb-4 flex items-center justify-between border-b border-indigo-100 pb-3 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">Dual Translation</span>
                                            </div>

                                            <select
                                                value={dualTargetLang}
                                                onChange={(e) => handleFetchDualTranslation(e.target.value)}
                                                disabled={isTranslating}
                                                className="rounded-xl border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
                                            >
                                                {DUAL_LANGUAGES.map((lang) => (
                                                    <option key={lang.code} value={lang.code}>
                                                        {lang.flag} {lang.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {isTranslating ? (
                                            <div className="flex h-48 flex-col items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400">
                                                <Loader2 className="h-7 w-7 animate-spin" />
                                                <p className="text-xs font-semibold">Translating side-by-side into {DUAL_LANGUAGES.find(l => l.code === dualTargetLang)?.name}...</p>
                                            </div>
                                        ) : (
                                            <div
                                                ref={rightScrollRef}
                                                onScroll={handleRightScroll}
                                                className="max-h-[50vh] space-y-3 overflow-y-auto pr-1"
                                            >
                                                {translatedText ? (
                                                    translatedText.split('\n').map((line, index) => (
                                                        <p key={index} className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                            {line || '\u00A0'}
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p className="text-xs italic text-slate-400">Select a language to load parallel translation.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {displaySummary.split('\n').map((line, index) => (
                                        <p
                                            key={index}
                                            className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-300"
                                        >
                                            {line || '\u00A0'}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 flex-col gap-4 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        {/* Export actions */}
                        <div className="flex flex-wrap gap-2">
                            {/* Copy */}
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                <Download className="h-4 w-4" />
                                Download TXT
                            </button>

                            {/* PDF */}
                            <button
                                type="button"
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FileText className="h-4 w-4" />
                                {exporting ? 'Exporting...' : 'Export as PDF'}
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setShowChat(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/60"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Chat with PDF
                            </button>

                            <button
                                type="button"
                                onClick={onNewUpload}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                New Upload
                            </button>

                            <Link
                                href="/history"
                                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
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