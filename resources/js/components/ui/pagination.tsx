import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    links?: PaginationLink[];
    onPageChange?: (page: number) => void;
    baseUrl?: string;
}

export function Pagination({
    currentPage,
    lastPage,
    total,
    perPage,
    links,
    onPageChange,
    baseUrl,
}: PaginationProps) {
    if (lastPage <= 1) return null;

    const from = Math.min((currentPage - 1) * perPage + 1, total);
    const to = Math.min(currentPage * perPage, total);

    return (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row dark:border-white/5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-900 dark:text-white">{from}</span> to{' '}
                <span className="font-bold text-slate-900 dark:text-white">{to}</span> of{' '}
                <span className="font-bold text-slate-900 dark:text-white">{total}</span> results
            </p>

            <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                {baseUrl ? (
                    <Link
                        href={`${baseUrl}?page=${Math.max(1, currentPage - 1)}`}
                        preserveScroll
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                            currentPage <= 1
                                ? 'pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600'
                                : 'border-slate-200 bg-white text-slate-700 shadow-xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                        aria-label="Previous Page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                            currentPage <= 1
                                ? 'pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600'
                                : 'border-slate-200 bg-white text-slate-700 shadow-xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                        aria-label="Previous Page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}

                {/* Page Number Indicators */}
                <span className="px-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {currentPage} / {lastPage}
                </span>

                {/* Next Button */}
                {baseUrl ? (
                    <Link
                        href={`${baseUrl}?page=${Math.min(lastPage, currentPage + 1)}`}
                        preserveScroll
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                            currentPage >= lastPage
                                ? 'pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600'
                                : 'border-slate-200 bg-white text-slate-700 shadow-xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                        aria-label="Next Page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => onPageChange?.(Math.min(lastPage, currentPage + 1))}
                        disabled={currentPage >= lastPage}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                            currentPage >= lastPage
                                ? 'pointer-events-none border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600'
                                : 'border-slate-200 bg-white text-slate-700 shadow-xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                        aria-label="Next Page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
