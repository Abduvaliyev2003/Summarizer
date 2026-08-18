import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    BookOpen,
    HelpCircle,
    Layers,
    CheckCircle2,
    XCircle,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Eye,
    EyeOff,
    Trophy,
} from 'lucide-react';

import { useQuizState } from '@/hooks/useQuizState';

interface StudySuiteViewerProps {
    rawContent: string;
}

interface QuizItem {
    id: number;
    question: string;
    options: { key: string; text: string }[];
    correctAnswer: string;
}

interface FlashcardItem {
    id: number;
    question: string;
    answer: string;
}

function ConfettiBurst() {
    const colours = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            {colours.map((colour, i) => (
                <span
                    key={i}
                    className="confetti-piece absolute h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colour, left: `${18 + i * 12}%`, top: '55%' }}
                />
            ))}
        </div>
    );
}

export default function StudySuiteViewer({ rawContent }: StudySuiteViewerProps) {
    const [activeTab, setActiveTab] = useState<'concepts' | 'quiz' | 'flashcards'>('flashcards');
    const [showAnswers, setShowAnswers] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const parsedData = useMemo(() => {
        let conceptsText = '';
        let quizText = '';
        let flashcardsText = '';

        if (rawContent.includes('=== KEY CONCEPTS ===')) {
            const parts = rawContent.split(/===\s*[A-Z\s]+\s*===/i);
            if (parts.length >= 4) {
                conceptsText = parts[1] || '';
                quizText = parts[2] || '';
                flashcardsText = parts[3] || '';
            } else {
                conceptsText = rawContent;
            }
        } else {
            conceptsText = rawContent;
        }

        const quizItems: QuizItem[] = [];
        if (quizText) {
            const qBlocks = quizText.split(/Question\s+\d+:/i).filter((b) => b.trim().length > 0);
            qBlocks.forEach((block, idx) => {
                const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
                if (lines.length > 0) {
                    const options: { key: string; text: string }[] = [];
                    let correctAns = '';
                    lines.slice(1).forEach((line) => {
                        const optMatch = line.match(/^([A-D])[\)\.\:]\s*(.+)$/i);
                        if (optMatch) { options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2] }); }
                        const ansMatch = line.match(/Correct Answer:\s*([A-D])?/i);
                        if (ansMatch) { correctAns = ansMatch[1] ? ansMatch[1].toUpperCase() : line; }
                    });
                    quizItems.push({
                        id: idx + 1,
                        question: lines[0],
                        options: options.length > 0 ? options : [
                            { key: 'A', text: 'Option A' }, { key: 'B', text: 'Option B' },
                            { key: 'C', text: 'Option C' }, { key: 'D', text: 'Option D' },
                        ],
                        correctAnswer: correctAns || 'A',
                    });
                }
            });
        }

        const flashcardItems: FlashcardItem[] = [];
        if (flashcardsText) {
            let idCounter = 1;
            flashcardsText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).forEach((line) => {
                if (line.includes('|')) {
                    const [qPart, aPart] = line.split('|');
                    const q = qPart.replace(/^Q:\s*/i, '').replace(/^-\s*/, '').trim();
                    const a = aPart.replace(/^A:\s*/i, '').trim();
                    if (q && a) { flashcardItems.push({ id: idCounter++, question: q, answer: a }); }
                }
            });
        }

        if (flashcardItems.length === 0 && rawContent) {
            rawContent.split('\n').filter((s) => s.trim().length > 10).slice(0, 5).forEach((st, i) => {
                flashcardItems.push({ id: i + 1, question: `Key Study Concept #${i + 1}`, answer: st.trim() });
            });
        }

        return { concepts: conceptsText.trim(), quizzes: quizItems, flashcards: flashcardItems };
    }, [rawContent]);

    const {
        selectedAnswers,
        correctCount,
        shakingId,
        burstId,
        answeredCount,
        totalQuizzes,
        handleOptionSelect,
    } = useQuizState(parsedData.quizzes);

    const currentCard = parsedData.flashcards[currentCardIndex] || { id: 1, question: 'No flashcards parsed.', answer: 'Please review the summary output.' };

    const navigateCard = useCallback((direction: 'next' | 'prev') => {
        if (isAnimating) { return; }
        setIsAnimating(true);
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => {
                const total = Math.max(1, parsedData.flashcards.length);
                return direction === 'next' ? (prev + 1) % total : prev === 0 ? total - 1 : prev - 1;
            });
            setIsAnimating(false);
        }, 200);
    }, [isAnimating, parsedData.flashcards.length]);

    useEffect(() => {
        if (activeTab !== 'flashcards') { return; }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') { navigateCard('next'); }
            else if (e.key === 'ArrowLeft') { navigateCard('prev'); }
            else if (e.key === ' ') { e.preventDefault(); setIsFlipped((f) => !f); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeTab, navigateCard]);

    return (
        <div className="flex flex-col gap-6">

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
                {[
                    { id: 'flashcards' as const, label: `🎴 Flashcards (${parsedData.flashcards.length})`, icon: <Layers className="h-4 w-4" />, active: 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' },
                    { id: 'quiz' as const, label: `❓ Exam Quiz (${parsedData.quizzes.length})`, icon: <HelpCircle className="h-4 w-4" />, active: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' },
                    { id: 'concepts' as const, label: '📌 Key Concepts', icon: <BookOpen className="h-4 w-4" />, active: 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' },
                ].map((tab) => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.id ? tab.active : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {/* ── FLASHCARDS ── */}
            {activeTab === 'flashcards' && (
                <div className="flex flex-col items-center py-2">
                    <div className="mb-4 flex items-center justify-between w-full max-w-md">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Card {currentCardIndex + 1} of {parsedData.flashcards.length}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-purple-500 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400 px-2.5 py-1 rounded-full">
                            <RotateCw className="h-3 w-3" /> Space · ← →
                        </span>
                    </div>

                    {/* 3D Flip Container */}
                    <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="perspective-1000 relative h-72 w-full max-w-md cursor-pointer select-none"
                        style={{ perspective: '1000px', WebkitPerspective: '1000px' }}
                    >
                        <div
                            className="preserve-3d relative h-full w-full transition-transform duration-500"
                            style={{
                                transformStyle: 'preserve-3d',
                                WebkitTransformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            }}
                        >
                            {/* Front — Question */}
                            <div
                                className={`backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8 shadow-xl dark:border-purple-500/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 transition-opacity duration-300 ${
                                    isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
                                }`}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(0deg) translateZ(1px)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">❓ QUESTION</span>
                                    <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                                </div>
                                <div className="my-auto text-center">
                                    <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-white">{currentCard.question}</p>
                                </div>
                                <div className="text-center text-xs text-slate-400">
                                    Click or press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800">Space</kbd> to reveal
                                </div>
                            </div>

                            {/* Back — Answer */}
                            <div
                                className={`backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-xl dark:border-emerald-500/30 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 transition-opacity duration-300 ${
                                    !isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
                                }`}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg) translateZ(1px)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">💡 ANSWER</span>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div className="my-auto text-center">
                                    <p className="text-base font-semibold leading-relaxed text-slate-900 dark:text-white">{currentCard.answer}</p>
                                </div>
                                <div className="text-center text-xs text-slate-400">
                                    Click or press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800">Space</kbd> to flip back
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress dots */}
                    <div className="mt-5 flex items-center gap-1.5">
                        {parsedData.flashcards.map((_, i) => (
                            <button key={i} type="button" onClick={() => { setIsFlipped(false); setCurrentCardIndex(i); }}
                                className={`rounded-full transition-all duration-300 ${i === currentCardIndex ? 'w-5 h-2.5 bg-purple-600' : 'w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-purple-300'}`}
                                aria-label={`Card ${i + 1}`} />
                        ))}
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                        <button type="button" onClick={() => navigateCard('prev')} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button type="button" onClick={() => setIsFlipped(!isFlipped)} className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition">
                            <RotateCw className="h-4 w-4" /> Flip
                        </button>
                        <button type="button" onClick={() => navigateCard('next')} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── QUIZ ── */}
            {activeTab === 'quiz' && (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-4 dark:from-indigo-500/10 dark:to-violet-500/10 dark:border-indigo-500/20">
                        <div>
                            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Test your knowledge with AI Generated Questions</span>
                            {answeredCount > 0 && (
                                <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-indigo-200/50 dark:bg-indigo-500/20">
                                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500" style={{ width: `${(answeredCount / totalQuizzes) * 100}%` }} />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {answeredCount > 0 && (
                                <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 shadow-sm dark:bg-slate-800">
                                    <Trophy className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{correctCount}<span className="text-slate-400 font-medium">/{answeredCount}</span></span>
                                </div>
                            )}
                            <button type="button" onClick={() => setShowAnswers(!showAnswers)} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300">
                                {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                {showAnswers ? 'Hide Keys' : 'Show Keys'}
                            </button>
                        </div>
                    </div>

                    {parsedData.quizzes.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-6">No structured multiple choice questions found.</p>
                    ) : (
                        parsedData.quizzes.map((q) => {
                            const userAns = selectedAnswers[q.id];
                            const isAnswered = Boolean(userAns);
                            const isCorrect = userAns === q.correctAnswer;

                            return (
                                <div key={q.id} className={`relative rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 transition-all ${shakingId === q.id ? 'animate-shake border-red-300 dark:border-red-500/40' : 'border-slate-200 dark:border-slate-800'}`}>
                                    {burstId === q.id && <ConfettiBurst />}
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{q.id}. {q.question}</h4>
                                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                                        {q.options.map((opt) => {
                                            const isSelected = userAns === opt.key;
                                            const isThisCorrect = opt.key === q.correctAnswer;
                                            let cls = 'border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-400 cursor-pointer dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200';
                                            if (isSelected && isThisCorrect) { cls = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500 cursor-default dark:bg-emerald-500/20 dark:text-emerald-200'; }
                                            else if (isSelected && !isThisCorrect) { cls = 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500 cursor-default dark:bg-red-500/20 dark:text-red-200'; }
                                            else if (showAnswers && isThisCorrect) { cls = 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300'; }
                                            return (
                                                <button key={opt.key} type="button" onClick={() => handleOptionSelect(q.id, opt.key)} disabled={isAnswered}
                                                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${cls}`}>
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200">{opt.key}</span>
                                                    <span>{opt.text}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {isAnswered && (
                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                                            {isCorrect
                                                ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Correct! Great job! 🎉</span>
                                                : <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle className="h-4 w-4" /> Incorrect. Correct answer is {q.correctAnswer}.</span>
                                            }
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ── KEY CONCEPTS ── */}
            {activeTab === 'concepts' && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">📌 Key Concepts &amp; Main Takeaways</h3>
                    {parsedData.concepts.split('\n').filter((l) => l.trim().length > 0).map((line, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="mt-1 w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{line.trim()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
