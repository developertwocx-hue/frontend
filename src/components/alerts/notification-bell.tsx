
"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, alertsService } from "@/lib/alerts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const data = await alertsService.getAlerts();
            setAlerts(data);
            setUnreadCount(data.filter(a => !a.is_read).length);
        } catch (error) {
            console.error("Failed to load alerts", error);
        }
    };

    const handleAlertClick = async (alert: Alert) => {
        if (!alert.is_read) {
            await alertsService.markAsRead(alert.id);
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (alert.vehicle_id) {
            router.push(`/dashboard/vehicles/${alert.vehicle_id}/compliance`);
        } else if (alert.action_link) {
            router.push(alert.action_link);
        }
    };

    const handleMarkAllRead = async () => {
        await alertsService.markAllAsRead();
        setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
        setUnreadCount(0);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="flex items-center justify-between font-normal">
                    <span className="font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                handleMarkAllRead();
                            }}
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {alerts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-1">
                            {alerts.map((alert) => (
                                <DropdownMenuItem
                                    key={alert.id}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                        !alert.is_read && "bg-muted/50"
                                    )}
                                    onClick={() => handleAlertClick(alert)}
                                >
                                    <div className="flex items-start justify-between w-full">
                                        <span className={cn(
                                            "font-medium text-sm",
                                            alert.severity === 'critical' ? "text-red-600" :
                                                alert.severity === 'warning' ? "text-orange-600" : "text-foreground"
                                        )}>
                                            {alert.title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatTimeAgo(alert.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {alert.message}
                                    </p>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="w-full text-center cursor-pointer justify-center text-xs"
                    onClick={() => router.push('/dashboard/compliance/alerts')}
                >
                    View all notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
