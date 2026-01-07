import api from './api';

// --- Interfaces ---

export interface ComplianceType {
  id: number;
  name: string;
  description?: string;
  category: 'roadworthiness' | 'registration' | 'insurance' | 'inspection' | 'other';
  scope_type: 'global' | 'state' | 'vehicle_type' | 'tenant';
  state_code?: string;
  vehicle_type_id?: number;
  tenant_id?: string;
  renewal_frequency_days: number;
  requires_document: boolean;
  is_required: boolean;
  is_active: boolean;
  alert_thresholds: number[];
  accepted_document_types: number[];
  sort_order: number;
}

export interface ComplianceRecord {
  id: number;
  tenant_id: string;
  vehicle_id: number;
  vehicle_compliance_requirement_id: number;
  compliance_type_id: number;
  issue_date: string;
  expiry_date: string;
  inspection_provider?: string;
  inspection_number?: string;
  notes?: string;
  submitted_by: {
    id: number;
    name: string;
    email: string;
  };
  approved_by?: {
    id: number;
    name: string;
    email: string;
  };
  approved_at?: string;
  is_current: boolean;
  status: 'compliant' | 'at_risk' | 'expired' | 'pending';
  days_until_expiry: number;
  compliance_type: ComplianceType;
  documents: ComplianceDocument[];
  created_at: string;
  updated_at: string;
  audit_logs?: any[];
}

export interface ComplianceDocument {
  id: number;
  document_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  url: string;
  pivot?: {
    is_primary: boolean;
  };
}

export interface ComplianceRequirement {
  requirement_id: number;
  compliance_type: string;
  compliance_type_name?: string;
  category: string;
  status: 'compliant' | 'at_risk' | 'expired' | 'pending';
  current_record: ComplianceRecord | null;
  days_until_expiry: number | null;
  is_overdue: boolean;
}

export interface ComplianceSummary {
  total_requirements: number;
  compliant: number;
  at_risk: number;
  expired: number;
  pending: number;
  compliance_score: number | string;
  overall_status: 'compliant' | 'at_risk' | 'expired' | 'pending';
  can_operate: boolean;
}

export interface ComplianceStatus {
  vehicle: {
    id: number;
    vehicle_type_id?: number;
    vehicle_type_name?: string;
    state_of_operation?: string;
    compliance_status: string;
    compliance_score: number | string;
    operational_status: string;
  };
  requirements: {
    required: ComplianceRequirement[];
    optional: ComplianceRequirement[];
  };
  summary: ComplianceSummary;
}

export interface ComplianceHistory {
  requirement: {
    id: number;
    compliance_type: {
      id: number;
      name: string;
    };
  };
  history: Array<{
    id: number;
    issue_date: string;
    expiry_date: string;
    is_current: boolean;
    status: 'compliant' | 'at_risk' | 'expired' | 'pending';
  }>;
}

// --- Service ---

export const complianceService = {
  // 1. Get Compliance Types
  async getComplianceTypes(params?: {
    vehicle_id?: number;
    category?: string;
    state_code?: string;
    vehicle_type_id?: number;
    is_active?: boolean;
  }) {
    const response = await api.get('/compliance-types', { params });
    return response.data;
  },

  // 2. Get Compliance Types for Vehicle
  async getVehicleComplianceTypes(vehicleId: number) {
    const response = await api.get(`/vehicles/${vehicleId}/compliance-types`);
    return response.data;
  },

  // 3. Get Vehicle Compliance Records
  async getVehicleComplianceRecords(vehicleId: number, params?: {
    compliance_type_id?: number;
    status?: string;
    current_only?: boolean;
  }) {
    const response = await api.get(`/vehicles/${vehicleId}/compliance-records`, { params });
    return response.data;
  },

  // 4. Get Single Compliance Record
  async getComplianceRecord(vehicleId: number, recordId: number) {
    const response = await api.get(`/vehicles/${vehicleId}/compliance-records/${recordId}`);
    return response.data;
  },

  // 5. Create Compliance Record
  async createComplianceRecord(vehicleId: number, data: FormData) {
    const response = await api.post(`/vehicles/${vehicleId}/compliance-records`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 6. Update Compliance Record
  async updateComplianceRecord(vehicleId: number, recordId: number, data: any) {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      const response = await api.post(`/vehicles/${vehicleId}/compliance-records/${recordId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    const response = await api.put(`/vehicles/${vehicleId}/compliance-records/${recordId}`, data);
    return response.data;
  },

  // 7. Delete Compliance Record
  async deleteComplianceRecord(vehicleId: number, recordId: number) {
    const response = await api.delete(`/vehicles/${vehicleId}/compliance-records/${recordId}`);
    return response.data;
  },

  // 7.1 Download Compliance Document
  async downloadComplianceDocument(vehicleId: number, recordId: number) {
    const response = await api.get(`/vehicles/${vehicleId}/compliance-records/${recordId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // 8. Get Vehicle Compliance Status
  async getVehicleComplianceStatus(vehicleId: number) {
    const response = await api.get(`/vehicles/${vehicleId}/compliance/status`);
    return response.data;
  },

  // 9. Get Compliance History
  async getComplianceHistory(vehicleId: number, requirementId: number) {
    const response = await api.get(`/vehicles/${vehicleId}/compliance/requirements/${requirementId}/history`);
    return response.data;
  },

  // 10. Approve Compliance Record
  async approveComplianceRecord(vehicleId: number, recordId: number) {
    const response = await api.post(`/vehicles/${vehicleId}/compliance-records/${recordId}/approve`);
    return response.data;
  },

  // 11. Get Compliance Categories
  async getComplianceCategories() {
    const response = await api.get('/compliance-types/categories');
    return response.data;
  },
};
