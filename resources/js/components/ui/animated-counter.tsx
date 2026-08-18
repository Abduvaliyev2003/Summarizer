import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
    target: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    /** Delay in ms before the counter starts (useful for staggered reveals) */
    delay?: number;
}

/**
 * Smoothly increments from 0 to `target` using an ease-out cubic easing
 * over `duration` milliseconds.  Mounts with 0 and triggers when the
 * component first becomes visible.
 */
export function AnimatedCounter({
    target,
    duration = 1800,
    prefix = '',
    suffix = '',
    className = '',
    delay = 0,
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const frameRef = useRef<number>(0);
    const started = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (started.current) {
                return;
            }

            started.current = true;

            const animate = (timestamp: number) => {
                if (!startTimeRef.current) {
                    startTimeRef.current = timestamp;
                }

                const elapsed = timestamp - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.round(eased * target));

                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animate);
                }
            };

            frameRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration, delay]);

    return (
        <span className={className}>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}
