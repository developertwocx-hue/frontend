
"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, alertsService } from "@/lib/alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCheck, Clock, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageLoading } from "@/components/ui/loading-overlay";
import { useRouter } from "next/navigation";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            // Fetch more alerts for the full page view
            const data = await alertsService.getAlerts(50);
            setAlerts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await alertsService.markAsRead(id);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    };

    const handleMarkAllRead = async () => {
        await alertsService.markAllAsRead();
        setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    };

    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading message="Loading notifications..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumbs items={[{ label: "Compliance", href: "/dashboard/compliance" }, { label: "Alerts" }]} />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground mt-2">Manage your compliance alerts and notifications.</p>
                    </div>
                    <Button variant="outline" onClick={handleMarkAllRead}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all read
                    </Button>
                </div>

                <div className="grid gap-4">
                    {alerts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <CheckCheck className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">All caught up!</h3>
                                <p className="text-muted-foreground">You have no new notifications.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        alerts.map((alert) => (
                            <Card
                                key={alert.id}
                                className={cn(
                                    "cursor-pointer hover:bg-muted/50 transition-colors",
                                    !alert.is_read && "border-l-4 border-l-primary"
                                )}
                                onClick={() => alert.action_link && router.push(alert.action_link)}
                            >
                                <CardContent className="p-4 sm:p-6 flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "mt-1 p-2 rounded-full",
                                            alert.severity === 'critical' ? "bg-red-100 text-red-600" :
                                                alert.severity === 'warning' ? "bg-orange-100 text-orange-600" :
                                                    "bg-blue-100 text-blue-600"
                                        )}>
                                            {alert.severity === 'critical' && <ShieldAlert className="h-4 w-4" />}
                                            {alert.severity === 'warning' && <Clock className="h-4 w-4" />}
                                            {alert.severity === 'info' && <Info className="h-4 w-4" />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={cn("font-medium", !alert.is_read && "font-bold")}>
                                                    {alert.title}
                                                </h4>
                                                {!alert.is_read && (
                                                    <Badge variant="secondary" className="text-[10px] h-5">New</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            <p className="text-xs text-muted-foreground pt-1">
                                                {new Date(alert.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {!alert.is_read && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => handleMarkAsRead(alert.id, e)}
                                            title="Mark as read"
                                        >
                                            <CheckCheck className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
