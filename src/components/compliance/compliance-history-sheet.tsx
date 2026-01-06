"use client";

import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { complianceService, ComplianceHistory } from "@/lib/compliance";
import { Loader2 } from "lucide-react";
import { ComplianceStatusBadge } from "./compliance-status-badge";
import { format } from "date-fns";

interface ComplianceHistorySheetProps {
    vehicleId: number;
    requirementId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComplianceHistorySheet({
    vehicleId,
    requirementId,
    open,
    onOpenChange,
}: ComplianceHistorySheetProps) {
    const [data, setData] = useState<ComplianceHistory | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && requirementId) {
            loadHistory();
        }
    }, [open, requirementId]);

    const loadHistory = async () => {
        if (!requirementId) return;
        setLoading(true);
        try {
            const res = await complianceService.getComplianceHistory(vehicleId, requirementId);
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Compliance History</SheetTitle>
                    <SheetDescription>
                        Historical records for {data?.requirement.compliance_type.name || "requirement"}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : data?.history && data.history.length > 0 ? (
                        <div className="relative border-l border-muted pl-6 space-y-6">
                            {data.history.map((record) => (
                                <div key={record.id} className="relative">
                                    <div className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 bg-background ${record.is_current ? "border-primary" : "border-muted-foreground"
                                        }`} />
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">
                                                {format(new Date(record.issue_date), "MMM d, yyyy")} - {format(new Date(record.expiry_date), "MMM d, yyyy")}
                                            </span>
                                            {record.is_current && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Current</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ComplianceStatusBadge status={record.status} className="text-[10px] px-1.5 py-0" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No history available.
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
