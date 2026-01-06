"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ComplianceStatus, complianceService } from "@/lib/compliance";
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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                    <div className={data.summary.compliance_score >= 80 ? "text-green-500" : "text-red-500"}>
                        {data.summary.compliance_score >= 80 ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Number(data.summary.compliance_score || 0).toFixed(0)}%</div>
                    <Progress
                        value={Number(data.summary.compliance_score || 0)}
                        className="mt-2 h-2"
                    // Color logic handled by CSS or custom Progress component usually, 
                    // but standard one is just primary color.
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Vehicle is <span className="font-medium">{data.summary.overall_status.replace('_', ' ')}</span>
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.summary.total_requirements}</div>
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {data.summary.compliant}</span>
                        <span className="text-orange-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> {data.summary.at_risk}</span>
                        <span className="text-red-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {data.summary.expired}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Required Items</CardTitle>
                    <CardDescription>Overview of compliance requirements status</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-4">
                            {data.requirements.map((req) => (
                                <div key={req.requirement_id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{req.compliance_type}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{req.category}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {req.days_until_expiry !== null && (
                                            <div className={`text-xs ${req.is_overdue || req.days_until_expiry < 30 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
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
                </CardContent>
            </Card>

            {!data.summary.can_operate && (
                <div className="col-span-full">
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Start Inhibit Active: This vehicle cannot operate due to missing critical compliance items.</span>
                    </div>
                </div>
            )}
        </div>
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
