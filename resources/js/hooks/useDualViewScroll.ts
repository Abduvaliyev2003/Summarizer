import { useRef, useCallback } from 'react';

/**
 * Custom React hook for synchronized proportional dual-pane scrolling.
 */
export function useDualViewScroll() {
    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const isSyncingScroll = useRef(false);

    const handleLeftScroll = useCallback(() => {
        if (isSyncingScroll.current) return;
        if (leftScrollRef.current && rightScrollRef.current) {
            isSyncingScroll.current = true;
            const { scrollTop, scrollHeight, clientHeight } = leftScrollRef.current;
            const scrollPercent = scrollTop / (scrollHeight - clientHeight || 1);

            const targetScrollTop = scrollPercent * (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight);
            rightScrollRef.current.scrollTop = targetScrollTop;

            requestAnimationFrame(() => {
                isSyncingScroll.current = false;
            });
        }
    }, []);

    const handleRightScroll = useCallback(() => {
        if (isSyncingScroll.current) return;
        if (leftScrollRef.current && rightScrollRef.current) {
            isSyncingScroll.current = true;
            const { scrollTop, scrollHeight, clientHeight } = rightScrollRef.current;
            const scrollPercent = scrollTop / (scrollHeight - clientHeight || 1);

            const targetScrollTop = scrollPercent * (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
            leftScrollRef.current.scrollTop = targetScrollTop;

            requestAnimationFrame(() => {
                isSyncingScroll.current = false;
            });
        }
    }, []);

    return {
        leftScrollRef,
        rightScrollRef,
        handleLeftScroll,
        handleRightScroll,
    };
}
