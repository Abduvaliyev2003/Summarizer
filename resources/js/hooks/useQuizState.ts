import { useState, useCallback } from 'react';

export interface QuizItem {
    id: number;
    question: string;
    options: { key: string; text: string }[];
    correctAnswer: string;
}

export function useQuizState(quizzes: QuizItem[]) {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [correctCount, setCorrectCount] = useState(0);
    const [shakingId, setShakingId] = useState<number | null>(null);
    const [burstId, setBurstId] = useState<number | null>(null);

    const handleOptionSelect = useCallback((qId: number, optionKey: string) => {
        if (selectedAnswers[qId]) return;
        const quiz = quizzes.find((q) => q.id === qId);
        const isCorrect = quiz?.correctAnswer === optionKey;
        setSelectedAnswers((prev) => ({ ...prev, [qId]: optionKey }));

        if (isCorrect) {
            setCorrectCount((c) => c + 1);
            setBurstId(qId);
            setTimeout(() => setBurstId(null), 900);
        } else {
            setShakingId(qId);
            setTimeout(() => setShakingId(null), 450);
        }
    }, [quizzes, selectedAnswers]);

    const resetQuiz = useCallback(() => {
        setSelectedAnswers({});
        setCorrectCount(0);
        setShakingId(null);
        setBurstId(null);
    }, []);

    const answeredCount = Object.keys(selectedAnswers).length;
    const totalQuizzes = quizzes.length;
    const scorePercentage = totalQuizzes > 0 ? Math.round((correctCount / totalQuizzes) * 100) : 0;

    return {
        selectedAnswers,
        correctCount,
        shakingId,
        burstId,
        answeredCount,
        totalQuizzes,
        scorePercentage,
        handleOptionSelect,
        resetQuiz,
    };
}
