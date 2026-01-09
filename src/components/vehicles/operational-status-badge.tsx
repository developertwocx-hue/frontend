
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, Wrench } from "lucide-react";

interface OperationalStatusBadgeProps {
    status?: 'operational' | 'non_operational' | 'maintenance' | string;
    canOperate?: boolean;
    className?: string; // Allow custom classes for flexibility
}

export function OperationalStatusBadge({ status, canOperate, className }: OperationalStatusBadgeProps) {
    // Determine visual state based on status and canOperate flag
    const getStatusConfig = () => {
        // Safety check: if explicitly flagged as cannot operate, it's critical regardless of status string
        if (canOperate === false) {
            return {
                variant: "destructive" as const,
                className: "bg-red-500/15 text-red-700 border-red-500/50 hover:bg-red-500/25",
                icon: AlertTriangle,
                label: "Non-Operational",
                tooltip: "This vehicle cannot operate due to compliance issues or manual override."
            };
        }

        switch (status?.toLowerCase()) {
            case 'operational':
                return {
                    variant: "outline" as const,
                    className: "bg-green-500/15 text-green-700 border-green-500/50 hover:bg-green-500/25",
                    icon: CheckCircle,
                    label: "Operational",
                    tooltip: "Vehicle is safe and ready for operation."
                };
            case 'maintenance':
                return {
                    variant: "outline" as const,
                    className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/50 hover:bg-yellow-500/25",
                    icon: Wrench,
                    label: "Maintenance",
                    tooltip: "Vehicle is currently under maintenance."
                };
            case 'non_operational':
            case 'non-operational':
                return {
                    variant: "destructive" as const, // Or use the standardized red outline if preferred
                    className: "bg-red-500/15 text-red-700 border-red-500/50 hover:bg-red-500/25",
                    icon: AlertTriangle,
                    label: "Non-Operational",
                    tooltip: "Vehicle is not operational."
                };
            default:
                // Default fallback
                return {
                    variant: "outline" as const,
                    className: "bg-gray-500/15 text-gray-700 border-gray-500/50 hover:bg-gray-500/25",
                    icon: undefined,
                    label: status || "Unknown",
                    tooltip: "Status unknown."
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant={config.variant}
                        className={cn("gap-1.5 cursor-help transition-colors", config.className, className)}
                    >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {config.label}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{config.tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
