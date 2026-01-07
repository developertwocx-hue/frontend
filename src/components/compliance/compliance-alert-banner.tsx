"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { complianceDashboardService, VehicleAtRisk } from "@/lib/complianceDashboard";
import { useRouter } from "next/navigation";

interface ComplianceAlertBannerProps {
    showDetails?: boolean;
}

export function ComplianceAlertBanner({ showDetails = false }: ComplianceAlertBannerProps) {
    const [atRiskData, setAtRiskData] = useState<{ total_at_risk: number; vehicles: VehicleAtRisk[] } | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadAtRiskData();
    }, []);

    const loadAtRiskData = async () => {
        try {
            const res = await complianceDashboardService.getFleetAtRisk();
            if (res.success && res.data) {
                setAtRiskData(res.data);
            }
        } catch (error) {
            console.error("Failed to load at-risk data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || dismissed || !atRiskData || atRiskData.total_at_risk === 0) {
        return null;
    }

    const expiredCount = atRiskData.vehicles.filter(v => v.compliance_status === 'expired').length;
    const atRiskCount = atRiskData.vehicles.filter(v => v.compliance_status === 'at_risk').length;

    return (
        <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/5 text-destructive dark:border-destructive flex items-center px-4 py-3">
            <AlertTriangle className="h-4 w-4 mr-4 flex-shrink-0" />
            <div className="flex-1 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base leading-none tracking-tight">Compliance Alert</span>
                    <span className="hidden sm:inline text-destructive/40">|</span>
                    <span className="text-sm text-destructive/90 font-medium">
                        {expiredCount > 0 && (
                            <span>{expiredCount} vehicle{expiredCount !== 1 ? 's' : ''} expired</span>
                        )}
                        {expiredCount > 0 && atRiskCount > 0 && <span>, </span>}
                        {atRiskCount > 0 && (
                            <span>{atRiskCount} at risk</span>
                        )}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 bg-background/50"
                        onClick={() => router.push('/dashboard/compliance')}
                    >
                        View Details
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => setDismissed(true)}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Dismiss</span>
                    </Button>
                </div>
            </div>
        </Alert>
    );
}
