import api from './api';

export interface VehicleType {
  id: number;
  tenant_id?: string | null;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleTypeField {
  id: number;
  vehicle_type_id: number;
  tenant_id: string | null;
  name: string;
  key: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  unit?: string;
  options?: Record<string, string>;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleFieldValue {
  id: number;
  vehicle_id: number;
  vehicle_type_field_id: number;
  value: string;
  field?: VehicleTypeField;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  tenant_id: string;
  vehicle_type_id: number;
  status: 'active' | 'maintenance' | 'inactive' | 'sold';
  qr_code_token?: string;
  vehicle_type?: VehicleType;
  field_values?: VehicleFieldValue[];
  created_at: string;
  updated_at: string;

  // Legacy fields (for backward compatibility, will be removed)
  name?: string;
  make?: string;
  model?: string;
  year?: number;
  registration_number?: string;
  vin?: string;
  serial_number?: string;
  capacity?: number;
  capacity_unit?: string;
  specifications?: string;
  purchase_date?: string;
  purchase_price?: number;
  last_service_date?: string;
  next_service_date?: string;
  notes?: string;
}

export interface VehicleDocument {
  id: number;
  tenant_id: string;
  vehicle_id: number;
  document_type: string;
  document_name: string;
  document_number?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  issue_date?: string;
  expiry_date?: string;
  is_expired: boolean;
  notes?: string;
  uploaded_by?: number;
  created_at: string;
}

export const vehicleTypeService = {
  async getAll() {
    const response = await api.get('/vehicle-types');
    return response.data;
  },

  async getOne(id: number) {
    const response = await api.get(`/vehicle-types/${id}`);
    return response.data;
  },

  async create(data: Partial<VehicleType>) {
    const response = await api.post('/vehicle-types', data);
    return response.data;
  },

  async update(id: number, data: Partial<VehicleType>) {
    const response = await api.put(`/vehicle-types/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/vehicle-types/${id}`);
    return response.data;
  },
};

export const vehicleTypeFieldService = {
  async getAll(vehicleTypeId?: number) {
    const url = vehicleTypeId
      ? `/vehicle-type-fields?vehicle_type_id=${vehicleTypeId}`
      : '/vehicle-type-fields';
    const response = await api.get(url);
    return response.data;
  },

  async getForType(vehicleTypeId: number, includeCustom: boolean = true) {
    // Get default fields (tenant_id = null) and optionally custom fields
    const response = await api.get(`/vehicle-types/${vehicleTypeId}/fields`, {
      params: { include_custom: includeCustom },
    });
    return response.data;
  },

  async create(data: Partial<VehicleTypeField>) {
    const response = await api.post('/vehicle-type-fields', data);
    return response.data;
  },

  async update(id: number, data: Partial<VehicleTypeField>) {
    const response = await api.put(`/vehicle-type-fields/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/vehicle-type-fields/${id}`);
    return response.data;
  },
};

export const vehicleService = {
  async getAll(filters?: {
    vehicle_name?: string;
    vehicle_type_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    include_field_values?: boolean;
  }) {
    const params: any = {
      include_field_values: filters?.include_field_values ?? true,
    };

    if (filters?.vehicle_name) params.vehicle_name = filters.vehicle_name;
    if (filters?.vehicle_type_id) params.vehicle_type_id = filters.vehicle_type_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;

    const response = await api.get('/vehicles', { params });
    return response.data;
  },

  async getOne(id: number, includeFieldValues: boolean = true) {
    const response = await api.get(`/vehicles/${id}`, {
      params: { include_field_values: includeFieldValues },
    });
    return response.data;
  },

  async create(data: {
    vehicle_type_id: number;
    status: string;
    field_values?: Record<string, any>;
  }) {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  async update(id: number, data: {
    vehicle_type_id?: number;
    status?: string;
    field_values?: Record<string, any>;
  }) {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },

  async bulkDelete(ids: number[]) {
    const response = await api.post('/vehicles/bulk-delete', { ids });
    return response.data;
  },

  async getStats(filters?: {
    vehicle_name?: string;
    vehicle_type_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const params: any = {};
    if (filters?.vehicle_name) params.vehicle_name = filters.vehicle_name;
    if (filters?.vehicle_type_id) params.vehicle_type_id = filters.vehicle_type_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;

    const response = await api.get('/vehicles/stats', { params });
    return response.data;
  },

  async getNameSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];
    const response = await api.get('/vehicles/autocomplete/names', {
      params: { query },
    });
    return response.data.data || [];
  },

  // Helper method to get field value by key
  getFieldValue(vehicle: Vehicle, fieldKey: string): string | undefined {
    if (!vehicle.field_values) return undefined;
    const fieldValue = vehicle.field_values.find(
      (fv) => fv.field?.key === fieldKey
    );
    return fieldValue?.value;
  },

  // Helper method to format field values for display
  formatFieldValues(vehicle: Vehicle): Record<string, any> {
    if (!vehicle.field_values) return {};
    const formatted: Record<string, any> = {};
    vehicle.field_values.forEach((fv) => {
      if (fv.field) {
        formatted[fv.field.key] = fv.value;
      }
    });
    return formatted;
  },
};

export const vehicleDocumentService = {
  async getAll(vehicleId: number) {
    const response = await api.get(`/vehicles/${vehicleId}/documents`);
    return response.data;
  },

  async create(vehicleId: number, data: FormData) {
    const response = await api.post(`/vehicles/${vehicleId}/documents`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(vehicleId: number, documentId: number) {
    const response = await api.delete(`/vehicles/${vehicleId}/documents/${documentId}`);
    return response.data;
  },
};
