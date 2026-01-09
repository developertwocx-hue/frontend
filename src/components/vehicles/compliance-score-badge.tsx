
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComplianceScoreBadgeProps {
    score?: number;
    trend?: 'up' | 'down' | 'stable';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function ComplianceScoreBadge({ score = 0, trend, size = 'md', showLabel = true }: ComplianceScoreBadgeProps) {
    // Config
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (score / 100) * circumference;

    // Determine color based on score
    let colorClass = "text-red-500";
    let bgClass = "bg-red-500/10";
    if (score >= 80) {
        colorClass = "text-green-500";
        bgClass = "bg-green-500/10";
    } else if (score >= 50) {
        colorClass = "text-yellow-500";
        bgClass = "bg-yellow-500/10";
    }

    // Size map
    const sizeMap = {
        sm: { width: 32, height: 32, fontSize: "text-[10px]", stroke: 3 },
        md: { width: 48, height: 48, fontSize: "text-xs", stroke: 4 },
        lg: { width: 64, height: 64, fontSize: "text-sm", stroke: 5 }
    };

    const currentSize = sizeMap[size];

    return (
        <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center justify-center">
                {/* SVG Ring */}
                <svg
                    width={currentSize.width}
                    height={currentSize.height}
                    viewBox="0 0 50 50"
                    className="transform -rotate-90"
                >
                    {/* Background Circle */}
                    <circle
                        cx="25"
                        cy="25"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={currentSize.stroke}
                        fill="transparent"
                        className="text-muted/20"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="25"
                        cy="25"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={currentSize.stroke}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-out", colorClass)}
                    />
                </svg>

                {/* Center Text */}
                <div className={cn("absolute inset-0 flex items-center justify-center font-bold", currentSize.fontSize, colorClass)}>
                    {Math.round(score)}%
                </div>
            </div>

            {showLabel && (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">Compliance Score</span>
                    {trend && (
                        <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                            {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                            {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                            {trend === 'stable' && <Minus className="h-3 w-3" />}
                            <span>vs last month</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
