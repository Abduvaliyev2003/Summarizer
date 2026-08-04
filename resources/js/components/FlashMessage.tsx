import { CheckCircle2, X } from 'lucide-react';

interface FlashMessageProps {
    flash?: {
        type: 'success' | 'error';
        message: string;
    };
}


export default function FlashMessage({ flash }: FlashMessageProps) {
    if (!flash) return null;

    return (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-800 dark:text-green-200">
            {flash.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span>{flash.message}</span>
        </div>
    );
}