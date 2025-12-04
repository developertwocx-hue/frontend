import { cn } from "@/lib/utils";
import { LoadingSpinner, LoadingPulse } from "./loading-spinner";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  variant?: "spinner" | "pulse";
  backdrop?: boolean;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  message,
  variant = "spinner",
  backdrop = true,
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 z-50",
        fullScreen ? "fixed inset-0" : "absolute inset-0",
        backdrop && "bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      {variant === "spinner" ? <LoadingSpinner size="lg" /> : <LoadingPulse />}
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <LoadingPulse />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
}

interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = "Loading..." }: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingPulse />
        <p className="text-lg font-medium text-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

interface SkeletonLoadingProps {
  rows?: number;
  className?: string;
}

export function SkeletonLoading({ rows = 3, className }: SkeletonLoadingProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}
