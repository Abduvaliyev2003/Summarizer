import { useState, useMemo } from 'react';
import {
    Table,
    CheckCircle2,
    GitCompare,
    Sparkles,
    Copy,
    Check,
    FileText,
} from 'lucide-react';

interface PdfComparisonViewerProps {
    rawContent: string;
    filenames?: string[];
}

export default function PdfComparisonViewer({ rawContent, filenames = [] }: PdfComparisonViewerProps) {
    const [activeTab, setActiveTab] = useState<'matrix' | 'similarities' | 'differences' | 'synthesis'>('matrix');
    const [copied, setCopied] = useState(false);

    // Parse structured sections
    const parsedData = useMemo(() => {
        let matrixText = '';
        let similaritiesText = '';
        let differencesText = '';
        let synthesisText = '';

        if (rawContent.includes('=== COMPARATIVE MATRIX ===')) {
            const parts = rawContent.split(/===\s*[A-Z\s\&\:]+\s*===/i);
            if (parts.length >= 5) {
                matrixText = parts[1] || '';
                similaritiesText = parts[2] || '';
                differencesText = parts[3] || '';
                synthesisText = parts[4] || '';
            } else {
                matrixText = rawContent;
            }
        } else {
            matrixText = rawContent;
        }

        // Parse markdown table rows from matrixText if available
        const tableLines = matrixText
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.startsWith('|'));

        let headers: string[] = [];
        const rows: string[][] = [];

        if (tableLines.length >= 2) {
            headers = tableLines[0]
                .split('|')
                .map((h) => h.trim())
                .filter((h) => h.length > 0);

            // Skip separator line (line 1 with ---)
            for (let i = 1; i < tableLines.length; i++) {
                if (tableLines[i].includes('---')) continue;
                const cells = tableLines[i]
                    .split('|')
                    .map((c) => c.trim())
                    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                if (cells.length > 0) {
                    rows.push(cells);
                }
            }
        }

        return {
            matrixRaw: matrixText.trim(),
            headers,
            rows,
            similarities: similaritiesText.trim() || 'No distinct similarities parsed.',
            differences: differencesText.trim() || 'No distinct differences parsed.',
            synthesis: synthesisText.trim() || 'No synthesized conclusion available.',
        };
    }, [rawContent]);

    const handleCopy = () => {
        navigator.clipboard.writeText(rawContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header info */}
            {filenames.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-4 dark:border-purple-500/30 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
                    <div className="flex items-center gap-2 text-sm font-bold text-purple-900 dark:text-purple-300">
                        <GitCompare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Comparing {filenames.length} Documents:
                        <span className="font-normal text-slate-700 dark:text-slate-300">
                            {filenames.join(' vs ')}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm hover:bg-purple-50 dark:border-purple-500/40 dark:bg-slate-800 dark:text-purple-300"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied!' : 'Copy Full Analysis'}
                    </button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setActiveTab('matrix')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        activeTab === 'matrix'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 dark:bg-purple-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    <Table className="h-4 w-4" />
                    📊 Comparison Matrix
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('similarities')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        activeTab === 'similarities'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 dark:bg-emerald-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    🤝 Shared Points
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('differences')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        activeTab === 'differences'
                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25 dark:bg-amber-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    <GitCompare className="h-4 w-4" />
                    ⚔️ Differences
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('synthesis')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        activeTab === 'synthesis'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 dark:bg-indigo-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    <Sparkles className="h-4 w-4" />
                    🧠 Synthesis
                </button>
            </div>

            {/* TAB 1: COMPARISON MATRIX */}
            {activeTab === 'matrix' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Table className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Side-by-Side Comparison Matrix
                    </h3>

                    {parsedData.headers.length > 0 && parsedData.rows.length > 0 ? (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                                    {parsedData.headers.map((h, i) => (
                                        <th
                                            key={i}
                                            className="p-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.rows.map((row, rIdx) => (
                                    <tr
                                        key={rIdx}
                                        className="border-b border-slate-100 hover:bg-purple-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                                    >
                                        {row.map((cell, cIdx) => (
                                            <td
                                                key={cIdx}
                                                className={`p-3.5 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${
                                                    cIdx === 0 ? 'font-semibold text-purple-900 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/10' : ''
                                                }`}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                            {parsedData.matrixRaw}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: SIMILARITIES */}
            {activeTab === 'similarities' && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/10">
                    <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-300 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Key Similarities & Shared Takeaways
                    </h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                        {parsedData.similarities}
                    </div>
                </div>
            )}

            {/* TAB 3: DIFFERENCES */}
            {activeTab === 'differences' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/10">
                    <h3 className="text-base font-bold text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
                        <GitCompare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Key Differences & Unique Insights
                    </h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                        {parsedData.differences}
                    </div>
                </div>
            )}

            {/* TAB 4: SYNTHESIS */}
            {activeTab === 'synthesis' && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-6 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-950/10">
                    <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Unified Synthesis & Conclusions
                    </h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                        {parsedData.synthesis}
                    </div>
                </div>
            )}
        </div>
    );
}
