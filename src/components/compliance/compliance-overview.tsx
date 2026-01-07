"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ComplianceStatus, complianceService } from "@/lib/compliance";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, CheckCircle, Clock, FileWarning } from "lucide-react";
import { ComplianceStatusBadge } from "./compliance-status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface ComplianceOverviewProps {
    vehicleId: number;
}

export function ComplianceOverview({ vehicleId }: ComplianceOverviewProps) {
    const [data, setData] = useState<ComplianceStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
    }, [vehicleId]);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const res = await complianceService.getVehicleComplianceStatus(vehicleId);
            if (res.success) {
                setData(res.data);
            }
        } catch (err) {
            setError("Failed to load compliance status");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-red-500">
                    {error || "No data available"}
                    <Button variant="link" onClick={loadStatus} className="ml-2">Retry</Button>
                </CardContent>
            </Card>
        );
    }

    // Combine required and optional requirements for display with their types
    const allRequirements = [
        ...(data.requirements.required || []).map(req => ({ ...req, isOptional: false })),
        ...(data.requirements.optional || []).map(req => ({ ...req, isOptional: true }))
    ];

    const complianceScore = Number(data.summary.compliance_score || 0);
    const isCompliant = data.summary.overall_status === 'compliant';

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Compliance Status</CardTitle>
                        <CardDescription>Overall vehicle compliance score and pending requirements</CardDescription>
                    </div>
                    {/* Status Badge Top Right */}
                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border",
                        isCompliant ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )}>
                        {isCompliant ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        {isCompliant ? "Compliant" : "Non-Compliant"}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-8 md:grid-cols-[200px_1fr]">
                    {/* Left: Score */}
                    <div className="flex flex-col items-center justify-center border-r pr-8">
                        <div className="relative flex items-center justify-center">
                            <svg className="h-32 w-32 transform -rotate-90">
                                <circle
                                    className="text-muted/20"
                                    strokeWidth="10"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="58"
                                    cx="64"
                                    cy="64"
                                />
                                <circle
                                    className={complianceScore >= 80 ? "text-green-500" : "text-red-500"}
                                    strokeWidth="10"
                                    strokeDasharray={365}
                                    strokeDashoffset={365 - (365 * complianceScore) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="58"
                                    cx="64"
                                    cy="64"
                                />
                            </svg>
                            <span className="absolute text-3xl font-bold">{complianceScore.toFixed(0)}%</span>
                        </div>
                        <p className="text-sm font-medium mt-4 text-muted-foreground text-center">
                            {data.summary.overall_status.replace(/_/g, ' ')}
                        </p>
                    </div>

                    {/* Right: Requirements List */}
                    <div className="space-y-4">
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                                {allRequirements.map((req) => (
                                    <div key={req.requirement_id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {req.compliance_type_name || req.compliance_type}
                                                {req.isOptional && <span className="text-xs text-muted-foreground ml-2">(Optional)</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {req.days_until_expiry !== null && (
                                                <div className={cn("text-xs font-medium",
                                                    (req.is_overdue || req.days_until_expiry < 30) ? "text-red-500" : "text-muted-foreground"
                                                )}>
                                                    {req.days_until_expiry < 0
                                                        ? `${Math.abs(req.days_until_expiry)} days overdue`
                                                        : `${req.days_until_expiry} days left`}
                                                </div>
                                            )}
                                            <ComplianceStatusBadge status={req.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {!data.summary.can_operate && (
                    <div className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Start Inhibit Active</p>
                            <p className="text-xs opacity-90">This vehicle cannot operate due to missing critical compliance items.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function FileTextIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    );
}
