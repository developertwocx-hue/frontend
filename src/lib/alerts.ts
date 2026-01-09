
import api from './api';
import { complianceDashboardService } from './complianceDashboard';

export interface Alert {
    id: string;
    type: 'expired' | 'expiring_soon' | 'compliance_at_risk' | 'approval_required';
    title: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    entity_id: number; // e.g., vehicle_id
    entity_type: 'vehicle' | 'document' | 'record';
    is_read: boolean;
    created_at: string;
    action_link?: string;
    vehicle_id?: number;
}

export const alertsService = {
    async getAlerts(limit: number = 5): Promise<Alert[]> {
        try {
            // Fetch data from compliance dashboard APIs in parallel
            const [atRiskRes, overdueRes, expiringRes] = await Promise.all([
                complianceDashboardService.getFleetAtRisk({ page: 1, limit: 5 }),
                complianceDashboardService.getOverdueItems({ page: 1, limit: 5 }),
                complianceDashboardService.getExpiringSoon(30, { page: 1, limit: 5 })
            ]);

            let alerts: Alert[] = [];

            // Process At Risk Vehicles
            if (atRiskRes.success) {
                const vehicles = (atRiskRes.data as any).vehicles || atRiskRes.data || [];
                const atRiskAlerts: Alert[] = vehicles.map((v: any) => ({
                    id: `risk-${v.vehicle_id}`,
                    type: 'compliance_at_risk',
                    title: `Vehicle #${v.vehicle_id} At Risk`,
                    message: `Vehicle has ${v.problem_count} problematic items and is ${v.compliance_status}.`,
                    severity: 'critical',
                    entity_id: v.vehicle_id,
                    entity_type: 'vehicle',
                    is_read: false,
                    created_at: new Date().toISOString(), // Real API might not have this for the list view, defaulting to now
                    action_link: `/dashboard/vehicles/${v.vehicle_id}/compliance`,
                    vehicle_id: v.vehicle_id
                }));
                alerts = [...alerts, ...atRiskAlerts];
            }

            // Process Overdue Items
            if (overdueRes.success) {
                const items = (overdueRes.data as any).items || overdueRes.data || [];
                const overdueAlerts: Alert[] = items.map((item: any) => ({
                    id: `overdue-${item.vehicle_id}-${item.requirement_id}`,
                    type: 'expired',
                    title: `${item.compliance_type_name} Overdue`,
                    message: `${item.compliance_type_name} for Vehicle #${item.vehicle_id} is overdue by ${item.days_overdue} days.`,
                    severity: 'warning',
                    entity_id: item.vehicle_id,
                    entity_type: 'record',
                    is_read: false,
                    created_at: item.expiry_date || new Date().toISOString(),
                    action_link: `/dashboard/vehicles/${item.vehicle_id}/compliance`,
                    vehicle_id: item.vehicle_id
                }));
                alerts = [...alerts, ...overdueAlerts];
            }

            // Process Expiring Items
            if (expiringRes.success) {
                const items = (expiringRes.data as any).items || expiringRes.data || [];
                const expiringAlerts: Alert[] = items.map((item: any) => ({
                    id: `expiring-${item.vehicle_id}-${item.requirement_id}`,
                    type: 'expiring_soon',
                    title: `${item.compliance_type_name} Expiring`,
                    message: `${item.compliance_type_name} for Vehicle #${item.vehicle_id} expires in ${item.days_until_expiry} days.`,
                    severity: 'info',
                    entity_id: item.vehicle_id,
                    entity_type: 'record',
                    is_read: false,
                    created_at: new Date().toISOString(),
                    action_link: `/dashboard/vehicles/${item.vehicle_id}/compliance`,
                    vehicle_id: item.vehicle_id
                }));
                alerts = [...alerts, ...expiringAlerts];
            }

            // Sort by severity (Critical > Warning > Info) and take top 10
            const severityOrder = { 'critical': 0, 'warning': 1, 'info': 2 };
            return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 10);

        } catch (error) {
            console.error("Failed to fetch alerts from dashboard APIs", error);
            return [];
        }
    },

    async markAsRead(id: string): Promise<void> {
        // Implement logic to mark as read, possibly storing in local storage or calling a backend endpoint if available
        // For now, since these are synthesized from live data, we might not be able to persistently "mark read" without backend support.
        // We'll mimic it in the frontend state via the NotificationBell component mostly.
        return;
    },

    async markAllAsRead(): Promise<void> {
        return;
    }
};
