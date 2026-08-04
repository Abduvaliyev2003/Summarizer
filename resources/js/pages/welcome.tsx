import { useState, useRef, useEffect, type DragEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    Sparkles,
    Zap,
    Rocket,
    ArrowRightIcon,
    StarIcon,
    ZapIcon,
    RocketIcon,
    SparklesIcon,
} from 'lucide-react';

import FlashMessage from '@/components/FlashMessage';
import SummaryModal from '@/components/SummaryModal';
import SummaryOptionsModal from '@/components/SummaryOptionsModal';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    pdf_limit: number;
    features: string[];
}

interface Props {
    plans?: Plan[];
    canRegister: boolean;
    auth?: {
        user?: any;
    };
    userStats?: {
        pdfCount: number;
        pdfLimit: number;
        canUpload: boolean;
    } | null;
    flash: {
        success?: string;
        error?: string;
    } | null;
}

type SummaryType =
    | 'default'
    | 'points'
    | 'highlight'
    | 'detailed';

export default function Welcome({
    plans,
    canRegister,
    auth,
    userStats,
    flash,
}: Props) {
    const [pdf, setPdf] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [summary, setSummary] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [showSummaryOptionsModal, setShowSummaryOptionsModal] =
        useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const limitReached = Boolean(
        userStats && !userStats.canUpload
    );

    const userPlanSlug =
        auth?.user?.plan?.slug || 'free';

    const safePlans: Plan[] = Array.isArray(plans)
        ? plans.map((plan) => ({
              ...plan,
              features: Array.isArray(plan.features)
                  ? plan.features
                  : [],
          }))
        : [];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleFileSelect = (file: File) => {
        if(limitReached) {
            alert('You have reached your PDF upload limit. Please upgrade your plan to upload more PDFs.');
            return;
        }
        setSelectedFile(file);
        setPdf(file);
        setShowSummaryOptionsModal(true);
    }

    const handleSummaryTypeSelect =   async (summaryType: SummaryType) => {
        setShowSummaryOptionsModal(false);
        if (!selectedFile || !auth?.user) return;

        setLoading(true);
        setProgress(0);
        setSummary('');

        const formData = new FormData();
        formData.append('pdf', selectedFile);
        formData.append('summary_type', summaryType);

        const progressInterval  = setInterval(() => {
            setProgress(prev => prev >= 90 ? 90 : prev + 10);
        }, 200)
        const  csrfToken  = document.cookie.match('XSRF-TOKEN=([^;]+)')?.[1] || '';
        const response = await fetch('/pdf/summarize', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
            },
            body: formData,

        });
        clearInterval(progressInterval);
         if  (!response.ok) {
            setLoading(false);
            setProgress(0);
            alert('Failed to summarize the PDF. Please try again.');
            return;
        }
        const data = await response.json();
        
        setProgress(100);
        let cleanSummary  = data.summary || ''  ;
        cleanSummary = cleanSummary
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#+\s/gm, '')
    .replace(/^-\s/gm, '');

setSummary(cleanSummary);

setTimeout(() => {
    setLoading(false);
    setShowSummary(true);
}, 500);

    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (auth?.user) { 
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf') {
            handleFileSelect(file);
        }
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file && file.type === 'application/pdf') {
                handleFileSelect(file);
            }
            const handleNewUpload = () => {
                setPdf(null);
                setSelectedFile(null);
                setSummary('');
                setShowSummary(false);
                
            };

            const getPlanIcon  = (planSlug: string) => {
                switch (planSlug) {
                    case 'free':
                        return <ZapIcon className="h-5 w-5 text-gray-500" />;
                    case 'standard':
                        return <RocketIcon className="h-5 w-5 text-blue-500" />;
                    case 'premium':
                        return <SparklesIcon className="h-5 w-5 text-yellow-500" />;
                    default:
                        return <StarIcon className="h-5 w-5 text-gray-500" />;
                }
            };

            const handlePlanClick = (plan: Plan) => {
                router.visit(plan.slug === 'free' ? '/register' : `/checkout/${plan.slug}`);
            };

            return (
                <>
                 <Head title="Pdf Summarizer - Ai-Powered Document Summaries" />
                 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-900 dark:to-violet-900">
                    <FlashMessage flash={flash?.success ? { type: 'success', message: flash.success } : flash?.error ? { type: 'error', message: flash.error } : undefined} />

                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div

                    </div>


                 </div>

                    </>
    };
        });
    // Continue your component here...
}