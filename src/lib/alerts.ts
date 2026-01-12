
import api from './api';

// New notification structure matching backend API
export interface Notification {
    id: string;
    type: 'overdue' | 'expiring_soon';
    priority: 'critical' | 'high' | 'medium' | 'low';
    is_read: boolean;
    vehicle: {
        id: number;
        registration_number: string;
        make: string;
        model: string;
        type: string;
        state: string;
    };
    compliance: {
        type_id: number;
        type_name: string;
        category: string;
        requirement_id: number;
        record_id: number;
    };
    expiry_date: string;
    days_overdue?: number;
    days_until_expiry: number;
    message: string;
    created_at: string;
}

export interface NotificationSummary {
    total: number;
    unread: number;
    overdue: number;
    expiring_soon: number;
    by_priority: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

export interface NotificationResponse {
    success: boolean;
    message: string;
    data: {
        summary: NotificationSummary;
        notifications: Notification[];
    };
}

// Legacy Alert interface for backward compatibility
export interface Alert {
    id: string;
    type: 'expired' | 'expiring_soon' | 'compliance_at_risk' | 'approval_required';
    title: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    entity_id: number;
    entity_type: 'vehicle' | 'document' | 'record';
    is_read: boolean;
    created_at: string;
    action_link?: string;
    vehicle_id?: number;
}

export const alertsService = {
    /**
     * Get notifications from new compliance alerts API
     * @param unreadOnly - Whether to fetch only unread notifications (default: true)
     * @param limit - Maximum number of notifications to return
     */
    async getNotifications(unreadOnly: boolean = true): Promise<NotificationResponse> {
        try {
            const response = await api.get('/compliance/dashboard/alerts', {
                params: { unread_only: unreadOnly }
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            return {
                success: false,
                message: "Failed to fetch notifications",
                data: {
                    summary: {
                        total: 0,
                        unread: 0,
                        overdue: 0,
                        expiring_soon: 0,
                        by_priority: { critical: 0, high: 0, medium: 0, low: 0 }
                    },
                    notifications: []
                }
            };
        }
    },

    /**
     * Legacy method - converts new notifications to old Alert format
     * Used for backward compatibility with existing components
     */
    async getAlerts(limit: number = 10): Promise<Alert[]> {
        try {
            const response = await this.getNotifications(true);

            if (!response.success) {
                return [];
            }

            // Convert new notifications to legacy Alert format
            const alerts: Alert[] = response.data.notifications.map(notif => ({
                id: notif.id,
                type: notif.type === 'overdue' ? 'expired' as const : 'expiring_soon' as const,
                title: notif.compliance.type_name,
                message: notif.message,
                severity: notif.priority === 'critical' || notif.priority === 'high' ? 'critical' :
                         notif.priority === 'medium' ? 'warning' : 'info',
                entity_id: notif.vehicle.id,
                entity_type: 'record' as const,
                is_read: notif.is_read,
                created_at: notif.created_at,
                action_link: `/dashboard/vehicles/${notif.vehicle.id}/compliance`,
                vehicle_id: notif.vehicle.id
            }));

            return alerts.slice(0, limit);
        } catch (error) {
            console.error("Failed to fetch alerts", error);
            return [];
        }
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        try {
            await api.post('/compliance/dashboard/alerts/mark-as-read', {
                notification_id: notificationId
            });
        } catch (error) {
            console.error("Failed to mark notification as read", error);
            throw error;
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<{ marked_count: number }> {
        try {
            const response = await api.post('/compliance/dashboard/alerts/mark-all-as-read');
            return response.data.data;
        } catch (error) {
            console.error("Failed to mark all notifications as read", error);
            throw error;
        }
    },

    /**
     * Clear all read status (reset all to unread)
     */
    async clearReadStatus(): Promise<void> {
        try {
            await api.post('/compliance/dashboard/alerts/clear-read');
        } catch (error) {
            console.error("Failed to clear read status", error);
            throw error;
        }
    },

    /**
     * Get priority icon for notification
     */
    getPriorityIcon(priority: string): string {
        switch (priority) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '⏰';
            case 'low': return '📅';
            default: return '📋';
        }
    },

    /**
     * Get priority color class
     */
    getPriorityColorClass(priority: string): string {
        switch (priority) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    }
};
