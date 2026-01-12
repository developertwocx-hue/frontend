
"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
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
import { Notification, alertsService } from "@/lib/alerts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await alertsService.getNotifications(true);

            if (response.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.summary.unread);
            }
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            loadNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [loadNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.is_read) {
                await alertsService.markAsRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Navigate to vehicle compliance page
            setIsOpen(false);
            router.push(`/dashboard/vehicles/${notification.vehicle.id}/compliance`);
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const result = await alertsService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success(`Marked ${result.marked_count} notifications as read`);
        } catch (error) {
            toast.error("Failed to mark all notifications as read");
        }
    };

    const getPriorityBadge = (priority: string) => {
        const icon = alertsService.getPriorityIcon(priority);
        const colorClass = alertsService.getPriorityColorClass(priority);

        return (
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", colorClass)}>
                {icon}
            </span>
        );
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">
                        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96" align="end" forceMount>
                <DropdownMenuLabel className="flex items-center justify-between font-normal p-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">Notifications</span>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} unread
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto px-2 py-1"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[400px]">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bell className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium mb-1">All caught up!</h3>
                            <p className="text-sm text-muted-foreground">
                                No new compliance notifications
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col items-start gap-2 p-3 cursor-pointer transition-colors",
                                        !notification.is_read && "bg-primary/5 border-l-2 border-primary"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start justify-between w-full gap-2">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            {getPriorityBadge(notification.priority)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "font-medium text-sm truncate",
                                                        notification.type === 'overdue' ? "text-red-600" : "text-orange-600"
                                                    )}>
                                                        {notification.vehicle.registration_number}
                                                    </span>
                                                    {!notification.is_read && (
                                                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs font-medium text-foreground mt-0.5">
                                                    {notification.compliance.type_name}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                            {formatTimeAgo(notification.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 w-full">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{notification.vehicle.make} {notification.vehicle.model}</span>
                                        <span>•</span>
                                        <span>{notification.vehicle.type}</span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="w-full text-center cursor-pointer justify-center text-sm py-2.5 font-medium"
                    onClick={() => {
                        setIsOpen(false);
                        router.push('/dashboard/compliance/alerts');
                    }}
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
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
}
