import {
    X,
    AlignLeft,
    List,
    Lightbulb,
    FileText,
    Lock,
    Sparkles,
    ArrowRight,
    Globe,
    GraduationCap,
} from 'lucide-react';
import { useState } from 'react';

type SummaryType =
    | 'default'
    | 'points'
    | 'highlight'
    | 'detailed'
    | 'quiz';

interface SummaryOptionsModalProps {
    show: boolean;
    fileName?: string;
    userPlanSlug: string;
    onClose: () => void;
    onSelect: (type: SummaryType, targetLanguage: string) => void;
}

const languages = [
    { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

const summaryOptions = [
    {
        type: 'default' as const,
        icon: AlignLeft,
        title: 'Default Summary',
        description:
            'A concise and easy-to-read summary of your document.',
        color: 'violet',
        requiredPlan: 'free',
    },
    {
        type: 'quiz' as const,
        icon: GraduationCap,
        title: '🎓 Student Study Suite',
        description:
            'Key concepts, interactive exam quizzes, and study flashcards.',
        color: 'purple',
        requiredPlan: 'free',
    },
    {
        type: 'points' as const,
        icon: List,
        title: 'Bullet Points',
        description:
            'Turn your document into clear and actionable bullet points.',
        color: 'blue',
        requiredPlan: 'standard',
    },
    {
        type: 'highlight' as const,
        icon: Lightbulb,
        title: 'Key Highlights',
        description:
            'Extract the most important ideas and key information.',
        color: 'amber',
        requiredPlan: 'premium',
    },
    {
        type: 'detailed' as const,
        icon: FileText,
        title: 'Detailed Summary',
        description:
            'Generate a comprehensive summary with more context and detail.',
        color: 'emerald',
        requiredPlan: 'premium',
    },
];

const planHierarchy: Record<string, number> = {
    free: 1,
    standard: 2,
    premium: 3,
};

const colorClasses: Record<
    string,
    {
        icon: string;
        iconBg: string;
        hover: string;
    }
> = {
    purple: {
        icon: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-500/10',
        hover: 'hover:border-purple-300 hover:bg-purple-50/50 dark:hover:border-purple-500/40 dark:hover:bg-purple-500/5',
    },
    violet: {
        icon: 'text-violet-600 dark:text-violet-400',
        iconBg: 'bg-violet-100 dark:bg-violet-500/10',
        hover: 'hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/5',
    },
    blue: {
        icon: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-500/10',
        hover: 'hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/5',
    },
    amber: {
        icon: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-500/10',
        hover: 'hover:border-amber-300 hover:bg-amber-50/50 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/5',
    },
    emerald: {
        icon: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
        hover: 'hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/5',
    },
};

export default function SummaryOptionsModal({
    show,
    fileName,
    userPlanSlug,
    onClose,
    onSelect,
}: SummaryOptionsModalProps) {
    const [selectedType, setSelectedType] = useState<SummaryType | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<string>('uz');

    if (!show) {
        return null;
    }

    const userLevel = planHierarchy[userPlanSlug] ?? planHierarchy.free;

    const canAccess = (requiredPlan: string) => {
        const requiredLevel = planHierarchy[requiredPlan] ?? planHierarchy.free;
        return userLevel >= requiredLevel;
    };

    const handleClick = (option: (typeof summaryOptions)[number]) => {
        if (!canAccess(option.requiredPlan)) {
            return;
        }

        setSelectedType(option.type);
        onSelect(option.type, targetLanguage);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-options-title"
        >
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900 sm:px-8">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
                            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>

                        <div className="min-w-0">
                            <h2
                                id="summary-options-title"
                                className="text-lg font-semibold text-slate-900 dark:text-white"
                            >
                                Choose Summary Options
                            </h2>

                            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                                {fileName || 'Your document'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-0 overflow-y-auto p-6 sm:p-8">

                    {/* Language Selection Bar */}
                    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                <div>
                                    <label htmlFor="target-language-select" className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Summary Language
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Choose the language for the output summary
                                    </p>
                                </div>
                            </div>

                            <select
                                id="target-language-select"
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                            Select Summary Format
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Choose how detailed or bulleted you want your summary to be.
                        </p>
                    </div>

                    {/* Options */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {summaryOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = selectedType === option.type;
                            const isLocked = !canAccess(option.requiredPlan);
                            const colors = colorClasses[option.color];

                            return (
                                <button
                                    key={option.type}
                                    type="button"
                                    onClick={() => handleClick(option)}
                                    disabled={isLocked}
                                    className={`
                                        group relative flex w-full
                                        items-start gap-4 rounded-xl
                                        border p-5 text-left
                                        transition-all duration-200
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-violet-500/30

                                        ${
                                            isSelected
                                                ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500 dark:border-violet-400 dark:bg-violet-500/10'
                                                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
                                        }

                                        ${
                                            !isLocked
                                                ? colors.hover
                                                : 'cursor-not-allowed opacity-70'
                                        }
                                    `}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`
                                            flex h-11 w-11 shrink-0
                                            items-center justify-center
                                            rounded-xl
                                            ${colors.iconBg}
                                        `}
                                    >
                                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                                    </div>

                                    {/* Text */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                {option.title}
                                            </h4>

                                            {isLocked && (
                                                <Lock className="h-4 w-4 text-slate-400" />
                                            )}
                                        </div>

                                        <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                                            {option.description}
                                        </p>

                                        {/* Plan badge */}
                                        <div className="mt-3">
                                            <span
                                                className={`
                                                    inline-flex
                                                    items-center
                                                    rounded-full
                                                    px-2.5 py-1
                                                    text-xs
                                                    font-medium
                                                    ${
                                                        isLocked
                                                            ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    }
                                                `}
                                            >
                                                {isLocked
                                                    ? `${capitalize(option.requiredPlan)} plan`
                                                    : 'Available'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    {!isLocked && (
                                        <ArrowRight
                                            className="
                                                mt-1 h-4 w-4 shrink-0
                                                text-slate-300
                                                transition-transform
                                                group-hover:translate-x-1
                                                group-hover:text-violet-500
                                                dark:text-slate-600
                                            "
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}