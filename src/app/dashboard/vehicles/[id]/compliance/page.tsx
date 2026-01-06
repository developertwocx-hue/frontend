"use client";

import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComplianceOverview } from "@/components/compliance/compliance-overview";
import { ComplianceRecordsTable } from "@/components/compliance/compliance-records-table";
import { ComplianceFormDialog } from "@/components/compliance/compliance-form-dialog";
import { complianceService, ComplianceRecord } from "@/lib/compliance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import DashboardLayout from "@/components/dashboard-layout";

export default function VehicleCompliancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const vehicleId = parseInt(id);
    const [records, setRecords] = useState<ComplianceRecord[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        loadRecords();
    }, [vehicleId, refreshTrigger]);

    const loadRecords = async () => {
        try {
            const res = await complianceService.getVehicleComplianceRecords(vehicleId);
            if (res.success) {
                setRecords(res.data);
            }
        } catch (error) {
            console.error("Failed to load records", error);
        }
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Vehicle Compliance</h2>
                        <p className="text-muted-foreground">
                            Manage compliance requirements, records, and documents.
                        </p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Compliance
                    </Button>
                </div>

                <ComplianceOverview vehicleId={vehicleId} key={refreshTrigger} />

                <Card>
                    <CardHeader>
                        <CardTitle>Compliance Records</CardTitle>
                        <CardDescription>History of all compliance submissions and their status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ComplianceRecordsTable
                            records={records}
                            vehicleId={vehicleId}
                            onRefresh={handleRefresh}
                        />
                    </CardContent>
                </Card>

                <ComplianceFormDialog
                    vehicleId={vehicleId}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={handleRefresh}
                />
            </div>
        </DashboardLayout>
    );
}
