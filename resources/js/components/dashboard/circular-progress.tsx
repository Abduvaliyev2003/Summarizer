interface CircularProgressProps {
    percent: number;
    pdfCount: number;
    pdfLimit: number;
    isUnlimited: boolean;
    isNearLimit: boolean;
}

export function CircularProgress({
    percent,
    pdfCount,
    pdfLimit,
    isUnlimited,
    isNearLimit,
}: CircularProgressProps) {
    const size = 160;
    const strokeWidth = 14;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = isUnlimited ? 0 : circumference - (percent / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90 transform">
                    <defs>
                        <linearGradient id="gradientPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="50%" stopColor="#9333ea" />
                            <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="gradientWarning" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>

                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-slate-100 dark:text-slate-800"
                        fill="transparent"
                    />

                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={isNearLimit ? 'url(#gradientWarning)' : 'url(#gradientPrimary)'}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {isUnlimited ? '∞' : `${percent}%`}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {isUnlimited ? 'Unlimited' : 'Used'}
                    </span>
                </div>
            </div>

            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {isUnlimited ? 'Unlimited monthly limit' : `${pdfCount} of ${pdfLimit} documents used`}
            </p>
        </div>
    );
}
