import api from './api';

// --- Interfaces ---

export interface FleetStatistics {
  fleet_overview: {
    total_vehicles: number;
    operational: number;
    non_operational: number;
    maintenance: number;
  };
  compliance_overview: {
    compliant: number;
    at_risk: number;
    expired: number;
    pending: number;
  };
  compliance_rate: {
    percentage: number;
    compliant_vehicles: number;
    total_vehicles: number;
  };
  requirements_overview: {
    total_requirements: number;
    compliant: number;
    at_risk: number;
    expired: number;
    pending: number;
  };
  expiring_soon: {
    within_7_days: number;
    within_14_days: number;
    within_30_days: number;
  };
  average_compliance_score: number;
}

export interface ProblematicRequirement {
  requirement_id: number;
  compliance_type: string;
  category: string;
  status: 'at_risk' | 'expired';
  days_until_expiry: number;
  expiry_date: string;
  is_required: boolean;
}

export interface VehicleAtRisk {
  vehicle_id: number;
  vehicle_type: string;
  state_of_operation: string;
  compliance_status: string;
  compliance_score: string;
  operational_status: string;
  problematic_requirements: ProblematicRequirement[];
  problem_count: number;
}

export interface OverdueItem {
  vehicle_id: number;
  vehicle_type: string;
  state_of_operation: string;
  requirement_id: number;
  compliance_type_id: number;
  compliance_type_name: string;
  category: string;
  is_required: boolean;
  expiry_date: string;
  days_overdue: number;
  current_record_id: number;
}

export interface ExpiringItem {
  vehicle_id: number;
  vehicle_type: string;
  state_of_operation: string;
  requirement_id: number;
  compliance_type_id: number;
  compliance_type_name: string;
  category: string;
  is_required: boolean;
  status: string;
  expiry_date: string;
  days_until_expiry: number;
  current_record_id: number;
}

export interface ComplianceAlert {
  alert_id: number;
  alert_type: string;
  status: 'pending' | 'sent' | 'acknowledged';
  days_until_expiry: number;
  vehicle: {
    id: number;
    type: string;
    state: string;
  };
  compliance_type: string;
  category: string;
  expiry_date: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  compliant: number;
  at_risk: number;
  expired: number;
  pending: number;
  compliance_rate: number;
}

// --- Service ---

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

export const complianceDashboardService = {
  // 1. Get Fleet Statistics
  async getFleetStats() {
    const response = await api.get('/compliance/dashboard/stats');
    return response.data;
  },

  // 2. Get Fleet At Risk (with pagination)
  async getFleetAtRisk(params?: PaginationParams) {
    const response = await api.get('/compliance/dashboard/fleet-at-risk', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 20
      }
    });
    return response.data;
  },

  // 3. Get Overdue Items (with pagination)
  async getOverdueItems(params?: PaginationParams) {
    const response = await api.get('/compliance/dashboard/overdue-items', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 20
      }
    });
    return response.data;
  },

  // 4. Get Expiring Soon (with pagination)
  async getExpiringSoon(days: number = 30, params?: PaginationParams) {
    const response = await api.get('/compliance/dashboard/expiring-soon', {
      params: {
        days,
        page: params?.page || 1,
        limit: params?.limit || 20
      }
    });
    return response.data;
  },

  // 5. Get Alerts
  async getAlerts(params?: {
    status?: 'pending' | 'sent' | 'acknowledged';
    alert_type?: string;
  }) {
    const response = await api.get('/compliance/dashboard/alerts', { params });
    return response.data;
  },

  // 6. Acknowledge Alert
  async acknowledgeAlert(alertId: number) {
    const response = await api.post(`/compliance/dashboard/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  // 7. Get Summary By Category
  async getSummaryByCategory() {
    const response = await api.get('/compliance/dashboard/summary-by-category');
    return response.data;
  },
};
