import { Sparkles } from 'lucide-react';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-violet-600/20">
                <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <span className="truncate text-base font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-300">
                PDF Summarizer
            </span>
        </div>
    );
}
