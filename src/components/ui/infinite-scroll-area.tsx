"use client";

import { useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface InfiniteScrollAreaProps {
    children: React.ReactNode;
    onLoadMore: () => void;
    hasMore: boolean;
    loading: boolean;
    className?: string;
    threshold?: number;
}

export function InfiniteScrollArea({
    children,
    onLoadMore,
    hasMore,
    loading,
    className = "h-[400px]",
    threshold = 0.8
}: InfiniteScrollAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !loading) {
                onLoadMore();
            }
        },
        [hasMore, loading, onLoadMore]
    );

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: "100px",
            threshold: 0.1
        };

        observerRef.current = new IntersectionObserver(handleObserver, options);

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observerRef.current.observe(currentSentinel);
        }

        return () => {
            if (observerRef.current && currentSentinel) {
                observerRef.current.unobserve(currentSentinel);
            }
        };
    }, [handleObserver]);

    return (
        <ScrollArea className={className} ref={scrollRef}>
            {children}

            {/* Sentinel element for intersection observer */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading indicator */}
            {loading && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* End of list indicator */}
            {!hasMore && !loading && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    No more items to load
                </div>
            )}
        </ScrollArea>
    );
}