"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, FileWarning, TrendingUp, Loader2 } from "lucide-react";
import { complianceDashboardService, FleetStatistics, VehicleAtRisk, OverdueItem, ExpiringItem, CategorySummary } from "@/lib/complianceDashboard";
import { useRouter } from "next/navigation";

import { PageLoading } from "@/components/ui/loading-overlay";
import DashboardLayout from "@/components/dashboard-layout";

export default function ComplianceDashboardPage() {
    const [stats, setStats] = useState<FleetStatistics | null>(null);
    const [atRisk, setAtRisk] = useState<VehicleAtRisk[]>([]);
    const [overdue, setOverdue] = useState<OverdueItem[]>([]);
    const [expiring, setExpiring] = useState<ExpiringItem[]>([]);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsRes, atRiskRes, overdueRes, expiringRes, categoriesRes] = await Promise.all([
                complianceDashboardService.getFleetStats(),
                complianceDashboardService.getFleetAtRisk(),
                complianceDashboardService.getOverdueItems(),
                complianceDashboardService.getExpiringSoon(30),
                complianceDashboardService.getSummaryByCategory()
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (atRiskRes.success) setAtRisk(atRiskRes.data.vehicles || []);
            if (overdueRes.success) setOverdue(overdueRes.data.items || []);
            if (expiringRes.success) setExpiring(expiringRes.data.items || []);
            if (categoriesRes.success) setCategories(categoriesRes.data.categories || []);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading message="Loading dashboard data..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Compliance Dashboard</h2>
                    <p className="text-muted-foreground">
                        Fleet-wide compliance overview and insights.
                    </p>
                </div>

                {/* Fleet Overview Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.compliance_rate.percentage.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.compliance_rate.compliant_vehicles} of {stats?.compliance_rate.total_vehicles} vehicles compliant
                            </p>
                            <Progress value={stats?.compliance_rate.percentage || 0} className="mt-2" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Fleet At Risk</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">{atRisk.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Vehicles needing attention
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                            <FileWarning className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{overdue.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Expired compliance items
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats?.expiring_soon.within_30_days || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Within next 30 days
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Compliance Status Breakdown */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fleet Compliance Status</CardTitle>
                            <CardDescription>Breakdown by compliance status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-medium">Compliant</span>
                                    </div>
                                    <span className="text-2xl font-bold">{stats?.compliance_overview.compliant || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        <span className="text-sm font-medium">At Risk</span>
                                    </div>
                                    <span className="text-2xl font-bold text-orange-500">{stats?.compliance_overview.at_risk || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileWarning className="h-4 w-4 text-red-500" />
                                        <span className="text-sm font-medium">Expired</span>
                                    </div>
                                    <span className="text-2xl font-bold text-red-500">{stats?.compliance_overview.expired || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">Pending</span>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-500">{stats?.compliance_overview.pending || 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance by Category</CardTitle>
                            <CardDescription>Performance across different categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-4">
                                    {categories.map((cat) => (
                                        <div key={cat.category} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium capitalize">{cat.category}</span>
                                                <span className="text-sm font-bold">{cat.compliance_rate.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={cat.compliance_rate} className="h-2" />
                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                                <span>{cat.compliant} compliant</span>
                                                <span>•</span>
                                                <span>{cat.at_risk} at risk</span>
                                                <span>•</span>
                                                <span>{cat.expired} expired</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Views */}
                <Card>
                    <CardHeader>
                        <CardTitle>Action Required</CardTitle>
                        <CardDescription>Vehicles and items requiring immediate attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="at-risk">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="at-risk">
                                    Fleet At Risk ({atRisk.length})
                                </TabsTrigger>
                                <TabsTrigger value="overdue">
                                    Overdue ({overdue.length})
                                </TabsTrigger>
                                <TabsTrigger value="expiring">
                                    Expiring Soon ({expiring.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="at-risk" className="mt-4">
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-3">
                                        {atRisk.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">No vehicles at risk</p>
                                        ) : (
                                            atRisk.map((vehicle) => (
                                                <div
                                                    key={vehicle.vehicle_id}
                                                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                                                    onClick={() => router.push(`/dashboard/vehicles/${vehicle.vehicle_id}/compliance`)}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-semibold">{vehicle.vehicle_type} #{vehicle.vehicle_id}</h4>
                                                            <p className="text-sm text-muted-foreground">{vehicle.state_of_operation}</p>
                                                        </div>
                                                        <Badge variant={vehicle.compliance_status === 'expired' ? 'destructive' : 'secondary'}>
                                                            {vehicle.compliance_status}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium">
                                                            {vehicle.problem_count} problematic item{vehicle.problem_count !== 1 ? 's' : ''}
                                                        </p>
                                                        {vehicle.problematic_requirements.slice(0, 2).map((req) => (
                                                            <div key={req.requirement_id} className="text-sm text-muted-foreground">
                                                                • {req.compliance_type} -
                                                                {req.days_until_expiry < 0
                                                                    ? ` ${Math.abs(req.days_until_expiry)} days overdue`
                                                                    : ` ${req.days_until_expiry} days left`}
                                                            </div>
                                                        ))}
                                                        {vehicle.problematic_requirements.length > 2 && (
                                                            <div className="text-sm text-muted-foreground">
                                                                and {vehicle.problematic_requirements.length - 2} more...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="overdue" className="mt-4">
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-3">
                                        {overdue.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">No overdue items</p>
                                        ) : (
                                            overdue.map((item) => (
                                                <div
                                                    key={`${item.vehicle_id}-${item.requirement_id}`}
                                                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                                                    onClick={() => router.push(`/dashboard/vehicles/${item.vehicle_id}/compliance`)}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-semibold">{item.compliance_type_name}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {item.vehicle_type} #{item.vehicle_id} • {item.state_of_operation}
                                                            </p>
                                                        </div>
                                                        <Badge variant="destructive">
                                                            {item.days_overdue} days overdue
                                                        </Badge>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className="capitalize">{item.category}</Badge>
                                                        {item.is_required && <Badge variant="outline">Required</Badge>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="expiring" className="mt-4">
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-3">
                                        {expiring.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">No items expiring soon</p>
                                        ) : (
                                            expiring.map((item) => (
                                                <div
                                                    key={`${item.vehicle_id}-${item.requirement_id}`}
                                                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                                                    onClick={() => router.push(`/dashboard/vehicles/${item.vehicle_id}/compliance`)}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-semibold">{item.compliance_type_name}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {item.vehicle_type} #{item.vehicle_id} • {item.state_of_operation}
                                                            </p>
                                                        </div>
                                                        <Badge variant={item.days_until_expiry <= 7 ? 'destructive' : 'secondary'}>
                                                            {item.days_until_expiry} days left
                                                        </Badge>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className="capitalize">{item.category}</Badge>
                                                        {item.is_required && <Badge variant="outline">Required</Badge>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
