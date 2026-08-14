import { useState, useMemo } from 'react';
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
} from 'lucide-react';

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

export default function StudySuiteViewer({ rawContent }: StudySuiteViewerProps) {
    const [activeTab, setActiveTab] = useState<'concepts' | 'quiz' | 'flashcards'>('flashcards');

    // Quiz interactive state
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showAnswers, setShowAnswers] = useState(false);

    // Flashcard interactive state
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Parse structured output from AI
    const parsedData = useMemo(() => {
        let conceptsText = '';
        let quizText = '';
        let flashcardsText = '';

        if (rawContent.includes('=== KEY CONCEPTS ===')) {
            const parts = rawContent.split(/===\s*[A-Z\s]+\s*===/i);
            // parts[0] might be empty or pre-header, parts[1] concepts, parts[2] quiz, parts[3] flashcards
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

        // Parse Quiz items
        const quizItems: QuizItem[] = [];
        if (quizText) {
            const qBlocks = quizText.split(/Question\s+\d+:/i).filter((b) => b.trim().length > 0);
            qBlocks.forEach((block, idx) => {
                const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
                if (lines.length > 0) {
                    const qText = lines[0];
                    const options: { key: string; text: string }[] = [];
                    let correctAns = '';

                    lines.slice(1).forEach((line) => {
                        const optMatch = line.match(/^([A-D])[\)\.\:]\s*(.+)$/i);
                        if (optMatch) {
                            options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2] });
                        }
                        const ansMatch = line.match(/Correct Answer:\s*([A-D])?/i);
                        if (ansMatch) {
                            correctAns = ansMatch[1] ? ansMatch[1].toUpperCase() : line;
                        }
                    });

                    quizItems.push({
                        id: idx + 1,
                        question: qText,
                        options: options.length > 0 ? options : [
                            { key: 'A', text: 'Option A' },
                            { key: 'B', text: 'Option B' },
                            { key: 'C', text: 'Option C' },
                            { key: 'D', text: 'Option D' },
                        ],
                        correctAnswer: correctAns || 'A',
                    });
                }
            });
        }

        // Parse Flashcard items
        const flashcardItems: FlashcardItem[] = [];
        if (flashcardsText) {
            const lines = flashcardsText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
            let idCounter = 1;
            lines.forEach((line) => {
                if (line.includes('|')) {
                    const [qPart, aPart] = line.split('|');
                    const qClean = qPart.replace(/^Q:\s*/i, '').replace(/^-\s*/, '').trim();
                    const aClean = aPart.replace(/^A:\s*/i, '').trim();
                    if (qClean && aClean) {
                        flashcardItems.push({ id: idCounter++, question: qClean, answer: aClean });
                    }
                }
            });
        }

        // Fallback default flashcards if regex parse missed
        if (flashcardItems.length === 0 && rawContent) {
            const sentences = rawContent.split('\n').filter((s) => s.trim().length > 10);
            sentences.slice(0, 5).forEach((st, i) => {
                flashcardItems.push({
                    id: i + 1,
                    question: `Key Study Concept #${i + 1}`,
                    answer: st.trim(),
                });
            });
        }

        return {
            concepts: conceptsText.trim(),
            quizzes: quizItems,
            flashcards: flashcardItems,
        };
    }, [rawContent]);

    const currentCard = parsedData.flashcards[currentCardIndex] || {
        id: 1,
        question: 'No flashcards parsed.',
        answer: 'Please review the summary output.',
    };

    const handleOptionSelect = (qId: number, optionKey: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [qId]: optionKey,
        }));
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev + 1) % Math.max(1, parsedData.flashcards.length));
        }, 150);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) =>
                prev === 0 ? Math.max(0, parsedData.flashcards.length - 1) : prev - 1
            );
        }, 150);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setActiveTab('flashcards')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        activeTab === 'flashcards'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 dark:bg-purple-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    <Layers className="h-4 w-4" />
                    🎴 Flashcards ({parsedData.flashcards.length})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('quiz')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        activeTab === 'quiz'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 dark:bg-indigo-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    <HelpCircle className="h-4 w-4" />
                    ❓ Exam Quiz ({parsedData.quizzes.length})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('concepts')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        activeTab === 'concepts'
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 dark:bg-violet-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    <BookOpen className="h-4 w-4" />
                    📌 Key Concepts
                </button>
            </div>

            {/* TAB 1: FLASHCARDS */}
            {activeTab === 'flashcards' && (
                <div className="flex flex-col items-center py-2">
                    <div className="mb-4 flex items-center justify-between w-full max-w-md text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Card {currentCardIndex + 1} of {parsedData.flashcards.length}</span>
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <RotateCw className="h-3.5 w-3.5" /> Click card to flip
                        </span>
                    </div>

                    {/* 3D Flip Card Container */}
                    <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="group relative h-72 w-full max-w-md cursor-pointer perspective-1000"
                    >
                        <div
                            className={`relative h-full w-full rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8 shadow-xl transition-all duration-500 dark:border-purple-500/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 flex flex-col justify-between ${
                                isFlipped ? 'ring-2 ring-purple-500/50' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    isFlipped
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                }`}>
                                    {isFlipped ? '💡 ANSWER' : '❓ QUESTION'}
                                </span>
                                <Sparkles className="h-4 w-4 text-purple-400" />
                            </div>

                            <div className="my-auto text-center">
                                <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-white">
                                    {isFlipped ? currentCard.answer : currentCard.question}
                                </p>
                            </div>

                            <div className="text-center text-xs text-slate-400">
                                {isFlipped ? 'Click to show Question' : 'Click to show Answer'}
                            </div>
                        </div>
                    </div>

                    {/* Next / Previous Controls */}
                    <div className="mt-6 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={prevCard}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700"
                        >
                            <RotateCw className="h-4 w-4" /> Flip
                        </button>

                        <button
                            type="button"
                            onClick={nextCard}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 2: EXAM QUIZ */}
            {activeTab === 'quiz' && (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
                        <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                            Test your knowledge with AI Generated Questions
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowAnswers(!showAnswers)}
                            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300"
                        >
                            {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {showAnswers ? 'Hide Answer Keys' : 'Show Answer Keys'}
                        </button>
                    </div>

                    {parsedData.quizzes.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-6">
                            No structured multiple choice questions found in this summary.
                        </p>
                    ) : (
                        parsedData.quizzes.map((q) => {
                            const userAns = selectedAnswers[q.id];
                            const isAnswered = Boolean(userAns);
                            const isCorrect = userAns === q.correctAnswer;

                            return (
                                <div
                                    key={q.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                        {q.id}. {q.question}
                                    </h4>

                                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                                        {q.options.map((opt) => {
                                            const isSelected = userAns === opt.key;
                                            const isThisCorrect = opt.key === q.correctAnswer;

                                            let btnClasses =
                                                'border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200';

                                            if (isSelected) {
                                                if (isThisCorrect) {
                                                    btnClasses = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-200';
                                                } else {
                                                    btnClasses = 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500 dark:bg-red-500/20 dark:text-red-200';
                                                }
                                            } else if (showAnswers && isThisCorrect) {
                                                btnClasses = 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300';
                                            }

                                            return (
                                                <button
                                                    key={opt.key}
                                                    type="button"
                                                    onClick={() => handleOptionSelect(q.id, opt.key)}
                                                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${btnClasses}`}
                                                >
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200">
                                                        {opt.key}
                                                    </span>
                                                    <span>{opt.text}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isAnswered && (
                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                                            {isCorrect ? (
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-4 w-4" /> Correct Answer! Great job! 🎉
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                                    <XCircle className="h-4 w-4" /> Incorrect. Correct answer is option {q.correctAnswer}.
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 3: KEY CONCEPTS */}
            {activeTab === 'concepts' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        📌 Key Concepts & Main Takeaways
                    </h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                        {parsedData.concepts}
                    </div>
                </div>
            )}

        </div>
    );
}
