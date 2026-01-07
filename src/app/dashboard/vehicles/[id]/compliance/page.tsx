"use client";

import { useEffect, useState, use } from "react";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComplianceOverview } from "@/components/compliance/compliance-overview";
import { ComplianceRecordsTable } from "@/components/compliance/compliance-records-table";
import { ComplianceFormDialog } from "@/components/compliance/compliance-form-dialog";
import { QuickComplianceAdd } from "@/components/compliance/quick-compliance-add";
import { complianceService, ComplianceRecord } from "@/lib/compliance";
import { vehicleService } from "@/lib/vehicles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";

import DashboardLayout from "@/components/dashboard-layout";
import { PageLoading } from "@/components/ui/loading-overlay";

export default function VehicleCompliancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const vehicleId = parseInt(id);
    const [records, setRecords] = useState<ComplianceRecord[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ComplianceRecord | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);
    const { setCustomLabel } = useBreadcrumb();

    useEffect(() => {
        loadData();
    }, [vehicleId, refreshTrigger]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load vehicle details for breadcrumb
            const vehicleRes = await vehicleService.getOne(vehicleId);
            if (vehicleRes.success && vehicleRes.data) {
                const vehicle = vehicleRes.data;
                // Get vehicle name from field_values for display, matching VehicleDetailPage logic
                const nameField = vehicle.field_values?.find((fv: any) =>
                    fv.field && fv.field.key && fv.field.key.toLowerCase() === 'name'
                );
                const vehicleName = nameField?.value || vehicle.field_values?.find((fv: any) =>
                    fv.field && fv.field.name && fv.field.name.toLowerCase() === 'name'
                )?.value || `Vehicle #${vehicle.id}`;

                setCustomLabel(`/dashboard/vehicles/${vehicleId}`, vehicleName);
            }

            // Load compliance records
            const res = await complianceService.getVehicleComplianceRecords(vehicleId);
            if (res.success) {
                setRecords(res.data);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleAdd = () => {
        setEditingRecord(null);
        setDialogOpen(true);
    };

    const handleEdit = (record: ComplianceRecord) => {
        setEditingRecord(record);
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading message="Loading compliance data..." />
            </DashboardLayout>
        );
    }

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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ComplianceOverview vehicleId={vehicleId} key={refreshTrigger} />
                    </div>
                    <div className="lg:col-span-1 h-full">
                        <QuickComplianceAdd vehicleId={vehicleId} onSuccess={handleRefresh} />
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Compliance Records</CardTitle>
                            <CardDescription>History of all compliance submissions and their status.</CardDescription>
                        </div>
                        <Button onClick={handleAdd} size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Full Form
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ComplianceRecordsTable
                            records={records}
                            vehicleId={vehicleId}
                            onRefresh={handleRefresh}
                            onEdit={handleEdit}
                            isLoading={loading}
                        />
                    </CardContent>
                </Card>

                <ComplianceFormDialog
                    vehicleId={vehicleId}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={handleRefresh}
                    record={editingRecord}
                />
            </div>
        </DashboardLayout>
    );
}
