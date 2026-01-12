
"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notification, NotificationSummary, alertsService } from "@/lib/alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCheck, Clock, ShieldAlert, Info, RefreshCw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageLoading } from "@/components/ui/loading-overlay";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AlertsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [summary, setSummary] = useState<NotificationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("all");
    const router = useRouter();

    useEffect(() => {
        loadNotifications();
    }, [showUnreadOnly]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await alertsService.getNotifications(showUnreadOnly);

            if (response.success) {
                setNotifications(response.data.notifications);
                setSummary(response.data.summary);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await alertsService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            if (summary) {
                setSummary({ ...summary, unread: Math.max(0, summary.unread - 1) });
            }
            toast.success("Marked as read");
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const result = await alertsService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            if (summary) {
                setSummary({ ...summary, unread: 0 });
            }
            toast.success(`Marked ${result.marked_count} notifications as read`);
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await alertsService.markAsRead(notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
            if (summary) {
                setSummary({ ...summary, unread: Math.max(0, summary.unread - 1) });
            }
        }
        router.push(`/dashboard/vehicles/${notification.vehicle.id}/compliance`);
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'critical': return <ShieldAlert className="h-4 w-4" />;
            case 'high': return <Clock className="h-4 w-4" />;
            case 'medium': return <Clock className="h-4 w-4" />;
            case 'low': return <Info className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return "bg-red-100 text-red-600";
            case 'high': return "bg-orange-100 text-orange-600";
            case 'medium': return "bg-yellow-100 text-yellow-600";
            case 'low': return "bg-blue-100 text-blue-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const filterNotifications = (notifications: Notification[]) => {
        switch (activeTab) {
            case 'overdue':
                return notifications.filter(n => n.type === 'overdue');
            case 'expiring':
                return notifications.filter(n => n.type === 'expiring_soon');
            case 'critical':
                return notifications.filter(n => n.priority === 'critical');
            case 'high':
                return notifications.filter(n => n.priority === 'high');
            default:
                return notifications;
        }
    };

    const filteredNotifications = filterNotifications(notifications);

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
                <Breadcrumbs items={[{ label: "Compliance", href: "/dashboard/compliance" }, { label: "Notifications" }]} />

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Compliance Notifications</h1>
                        <p className="text-muted-foreground mt-2">Monitor overdue and expiring compliance items.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {showUnreadOnly ? 'Show All' : 'Unread Only'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadNotifications}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        {summary && summary.unread > 0 && (
                            <Button variant="outline" onClick={handleMarkAllRead}>
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.total}</div>
                                <p className="text-xs text-muted-foreground">
                                    {summary.unread} unread
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                <ShieldAlert className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
                                <p className="text-xs text-muted-foreground">
                                    {summary.by_priority.critical} critical
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                                <Clock className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{summary.expiring_soon}</div>
                                <p className="text-xs text-muted-foreground">
                                    Within 30 days
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">By Priority</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                        Critical: {summary.by_priority.critical}
                                    </Badge>
                                    <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                        High: {summary.by_priority.high}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs for filtering */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                        <TabsTrigger value="overdue">Overdue ({summary?.overdue || 0})</TabsTrigger>
                        <TabsTrigger value="expiring">Expiring ({summary?.expiring_soon || 0})</TabsTrigger>
                        <TabsTrigger value="critical">Critical ({summary?.by_priority.critical || 0})</TabsTrigger>
                        <TabsTrigger value="high">High ({summary?.by_priority.high || 0})</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        <div className="grid gap-4">
                            {filteredNotifications.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="rounded-full bg-muted p-4 mb-4">
                                            <CheckCheck className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="font-semibold text-lg">All caught up!</h3>
                                        <p className="text-muted-foreground">
                                            {activeTab === 'all' ? 'You have no notifications.' : `No ${activeTab} notifications.`}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className={cn(
                                            "cursor-pointer hover:bg-muted/50 transition-colors",
                                            !notification.is_read && "border-l-4 border-l-primary"
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <CardContent className="p-4 sm:p-6 flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={cn("mt-1 p-2 rounded-full", getPriorityColor(notification.priority))}>
                                                    {getPriorityIcon(notification.priority)}
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className={cn("font-medium", !notification.is_read && "font-bold")}>
                                                            {notification.vehicle.registration_number} - {notification.compliance.type_name}
                                                        </h4>
                                                        {!notification.is_read && (
                                                            <Badge variant="secondary" className="text-[10px] h-5">New</Badge>
                                                        )}
                                                        <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(notification.priority))}>
                                                            {notification.priority.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>{notification.vehicle.make} {notification.vehicle.model}</span>
                                                        <span>•</span>
                                                        <span>{notification.vehicle.type}</span>
                                                        <span>•</span>
                                                        <span>Expires: {new Date(notification.expiry_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground pt-1">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {!notification.is_read && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
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
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
