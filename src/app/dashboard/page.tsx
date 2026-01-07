"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DashboardLayout from "@/components/dashboard-layout";
import { ComplianceAlertBanner } from "@/components/compliance/compliance-alert-banner";
import { vehicleService } from "@/lib/vehicles";
import { tenantService } from "@/lib/tenant";
import { getAllDocuments } from "@/lib/api/vehicleDocuments";
import {
  Truck,
  CheckCircle,
  Wrench,
  XCircle,
  ShoppingCart,
  FileText,
  AlertCircle,
  Plus,
  Upload,
  BarChart3,
  Clock
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
  });
  const [tenant, setTenant] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [recentVehiclesLoading, setRecentVehiclesLoading] = useState(true);
  const [expiringDocsLoading, setExpiringDocsLoading] = useState(true);
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);
  const [expiringDocuments, setExpiringDocuments] = useState<any[]>([]);

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
        setStatsLoading(false);

        // Step 3: Process recent vehicles (bottom section)
        const recent = [...vehicles]
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentVehicles(recent);
        setRecentVehiclesLoading(false);

        // Step 4: Process expiring documents (bottom section)
        setExpiringDocuments(expiring.slice(0, 5));
        setExpiringDocsLoading(false);

        // Step 5: Fetch tenant info (bottom section)
        const tenantRes = await tenantService.getCurrentTenant();
        setTenant(tenantRes.data);
        setTenantLoading(false);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStatsLoading(false);
        setRecentVehiclesLoading(false);
        setExpiringDocsLoading(false);
        setTenantLoading(false);
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

        {/* Expiring Documents Alert */}
        {(expiringDocsLoading || (stats.expiringSoon > 0 && expiringDocuments.length > 0)) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Documents Expiring Soon
                  </CardTitle>
                  <CardDescription>Review and renew these documents</CardDescription>
                </div>
                {!expiringDocsLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/documents?filter=expiring")}
                  >
                    View All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {expiringDocsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.document_name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {new Date(doc.expiry_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
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
                <div className="space-y-3">
                  {recentVehicles.map((vehicle: any) => {
                    const vehicleName = getVehicleName(vehicle);
                    const vehicleType = vehicle.vehicle_type?.name || "Unknown Type";

                    return (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{vehicleName}</p>
                            <p className="text-sm text-muted-foreground">{vehicleType}</p>
                          </div>
                        </div>
                        <Badge variant={
                          vehicle.status === "active" ? "default" :
                          vehicle.status === "maintenance" ? "secondary" :
                          "outline"
                        }>
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

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              {tenantLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : tenant ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{tenant.email}</p>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{tenant.subscription_plan}</p>
                      <p className="text-sm text-muted-foreground">Subscription Plan</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(tenant.subscription_ends_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Subscription Ends</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No business information available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
