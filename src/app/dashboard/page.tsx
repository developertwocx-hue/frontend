"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DashboardLayout from "@/components/dashboard-layout";
import { ComplianceAlertBanner } from "@/components/compliance/compliance-alert-banner";
import { VehicleStatusChart } from "@/components/dashboard/vehicle-status-chart";
import { FleetComplianceChart } from "@/components/dashboard/fleet-compliance-chart";
import { vehicleService } from "@/lib/vehicles";
import { complianceDashboardService } from "@/lib/complianceDashboard";
import { getAllDocuments } from "@/lib/api/vehicleDocuments";
import {
  Truck,
  CheckCircle,
  Wrench,
  XCircle,
  FileText,
  AlertCircle,
  Plus,
  BarChart3
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    inactiveVehicles: 0,
    totalDocuments: 0,
    expiringSoon: 0,
    // Compliance stats
    compliantItems: 0,
    atRiskItems: 0,
    expiredItems: 0,
    pendingItems: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentVehiclesLoading, setRecentVehiclesLoading] = useState(true);
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all data sequentially to avoid duplicate calls
    const fetchAllData = async () => {
      try {
        // Step 1: Fetch vehicles for stats (top widgets load first)
        const vehiclesRes = await vehicleService.getAll();
        const vehicles = vehiclesRes.data || [];

        // Calculate and show vehicle stats immediately
        setStats(prev => ({
          ...prev,
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.filter((v: any) => v.status === "active").length,
          maintenanceVehicles: vehicles.filter((v: any) => v.status === "maintenance").length,
          inactiveVehicles: vehicles.filter((v: any) => v.status === "inactive").length,
        }));

        // Step 2: Fetch documents for stats (complete top widgets)
        const documentsRes = await getAllDocuments().catch(() => []);
        const documents = documentsRes || [];

        // Calculate expiring soon (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const today = new Date();

        const expiring = documents.filter((doc: any) => {
          if (!doc.expiry_date) return false;
          const expiryDate = new Date(doc.expiry_date);
          return expiryDate > today && expiryDate <= thirtyDaysFromNow;
        });

        // Update document stats and mark stats as loaded
        setStats(prev => ({
          ...prev,
          totalDocuments: documents.length,
          expiringSoon: expiring.length,
        }));

        // Step 2.5: Fetch Compliance Status
        const complianceStatsRes = await complianceDashboardService.getFleetStats();
        if (complianceStatsRes.success) {
          const overview = complianceStatsRes.data.compliance_overview;
          setStats(prev => ({
            ...prev,
            compliantItems: overview.compliant || 0,
            atRiskItems: overview.at_risk || 0,
            expiredItems: overview.expired || 0,
            pendingItems: overview.pending || 0,
          }));
        }

        setStatsLoading(false);

        // Step 3: Process recent vehicles (bottom section)
        const recent = [...vehicles]
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentVehicles(recent);
        setRecentVehiclesLoading(false);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStatsLoading(false);
        setRecentVehiclesLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getVehicleFieldValue = (vehicle: any, key: string) => {
    const fieldValues = vehicle.field_values || vehicle.fieldValues;
    if (!fieldValues || !Array.isArray(fieldValues) || fieldValues.length === 0) {
      return null;
    }

    // Look for field by key (preferred) or by name
    const field = fieldValues.find((fv: any) => {
      // Handle both nested 'field' object and direct properties
      const fieldDef = fv.field || fv;
      if (!fieldDef) return false;

      // Check field key first (exact match)
      if (fieldDef.key && fieldDef.key.toLowerCase() === key.toLowerCase()) return true;
      // Then check field name (contains)
      if (fieldDef.name && fieldDef.name.toLowerCase().includes(key.toLowerCase())) return true;
      return false;
    });

    return field?.value || null;
  };

  const getVehicleName = (vehicle: any) => {
    // First, try to get the "name" field (this is the default field in all vehicle types)
    const name = getVehicleFieldValue(vehicle, "name");
    if (name) return name;

    // Fallback: try other common naming fields
    const fallbackName = getVehicleFieldValue(vehicle, "vehicle name") ||
      getVehicleFieldValue(vehicle, "model") ||
      getVehicleFieldValue(vehicle, "plate") ||
      getVehicleFieldValue(vehicle, "license");
    if (fallbackName) return fallbackName;

    // If still no name found, use vehicle ID
    return `Vehicle #${vehicle.id}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your fleet.
          </p>
        </div>

        <ComplianceAlertBanner showDetails={true} />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                className="h-auto py-2.5 justify-start"
                onClick={() => router.push("/dashboard/vehicles/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Add Vehicle</div>
                  <div className="text-xs opacity-90">Create new vehicle entry</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2.5 justify-start"
                onClick={() => router.push("/dashboard/documents")}
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold text-sm">View Documents</div>
                  <div className="text-xs opacity-70">Manage all documents</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2.5 justify-start"
                onClick={() => router.push("/dashboard/vehicles")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold text-sm">View Fleet</div>
                  <div className="text-xs opacity-70">See all vehicles</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                  <p className="text-xs text-muted-foreground">All vehicles in your fleet</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.activeVehicles}</div>
                  <p className="text-xs text-muted-foreground">Currently operational</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.maintenanceVehicles}</div>
                  <p className="text-xs text-muted-foreground">Under maintenance</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.inactiveVehicles}</div>
                  <p className="text-xs text-muted-foreground">Not in use</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">All uploaded documents</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                  <p className="text-xs text-muted-foreground">Within next 30 days</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <VehicleStatusChart
            activeVehicles={stats.activeVehicles}
            maintenanceVehicles={stats.maintenanceVehicles}
            inactiveVehicles={stats.inactiveVehicles}
            loading={statsLoading}
          />
          <FleetComplianceChart
            compliant={stats.compliantItems}
            atRisk={stats.atRiskItems}
            expired={stats.expiredItems}
            pending={stats.pendingItems}
            loading={statsLoading}
          />
        </div>

        {/* Recent Vehicles (Full Width) */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Vehicles</CardTitle>
              <CardDescription>Latest additions to your fleet</CardDescription>
            </CardHeader>
            <CardContent>
              {recentVehiclesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : recentVehicles.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recentVehicles.map((vehicle: any) => {
                    const vehicleName = getVehicleName(vehicle);
                    const vehicleType = vehicle.vehicle_type?.name || "Unknown Type";

                    return (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors gap-4"
                        onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate" title={vehicleName}>{vehicleName}</p>
                            <p className="text-sm text-muted-foreground truncate">{vehicleType}</p>
                          </div>
                        </div>
                        <Badge variant={
                          vehicle.status === "active" ? "default" :
                            vehicle.status === "maintenance" ? "secondary" :
                              "outline"
                        } className="shrink-0">
                          {vehicle.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No vehicles yet</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
