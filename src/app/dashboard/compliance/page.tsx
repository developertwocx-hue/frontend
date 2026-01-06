"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, Info } from "lucide-react";

import DashboardLayout from "@/components/dashboard-layout";

export default function ComplianceDashboardPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Compliance Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of fleet compliance status.
                    </p>
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                        The fleet-wide compliance dashboard is currently under development. Please visit individual vehicle pages to manage compliance records.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Placeholder widgets */}
                    <Card className="opacity-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Fleet At Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--</div>
                        </CardContent>
                    </Card>
                    <Card className="opacity-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--</div>
                        </CardContent>
                    </Card>
                    <Card className="opacity-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--%</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
