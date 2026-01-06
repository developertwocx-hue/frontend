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
                return { variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' };
            case 'at_risk':
                return { variant: 'default' as const, className: 'bg-orange-500 hover:bg-orange-600' };
            case 'expired':
                return { variant: 'destructive' as const, className: '' };
            case 'pending':
                return { variant: 'secondary' as const, className: 'bg-gray-500 text-white hover:bg-gray-600' };
            default:
                return { variant: 'secondary' as const, className: '' };
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
