import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComplianceStatusBadgeProps {
    status: 'compliant' | 'at_risk' | 'expired' | 'pending' | string;
    className?: string;
}

export function ComplianceStatusBadge({ status, className }: ComplianceStatusBadgeProps) {
    const getStatusConfig = (s: string) => {
        switch (s.toLowerCase()) {
            case 'compliant':
                return { variant: 'outline' as const, className: 'bg-green-500/15 text-green-700 border-green-500/50 hover:bg-green-500/25' };
            case 'at_risk':
                return { variant: 'outline' as const, className: 'bg-orange-500/15 text-orange-700 border-orange-500/50 hover:bg-orange-500/25' };
            case 'expired':
            case 'overdue':
                return { variant: 'outline' as const, className: 'bg-red-500/15 text-red-700 border-red-500/50 hover:bg-red-500/25' };
            case 'pending':
                return { variant: 'outline' as const, className: 'bg-gray-500/15 text-gray-700 border-gray-500/50 hover:bg-gray-500/25' };
            case 'active':
                return { variant: 'outline' as const, className: 'bg-primary/20 text-primary border-primary/50 hover:bg-primary/30' };
            default:
                return { variant: 'outline' as const, className: 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70' };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge
            variant={config.variant}
            className={cn(
                "capitalize px-2 py-0.5 font-medium",
                config.className,
                className
            )}
        >
            {status.replace('_', ' ')}
        </Badge>
    );
}
