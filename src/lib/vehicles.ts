import api from './api';

export interface VehicleType {
  id: number;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: number;
  tenant_id: string;
  vehicle_type_id: number;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  registration_number?: string;
  vin?: string;
  serial_number?: string;
  capacity?: number;
  capacity_unit: string;
  specifications?: string;
  status: 'active' | 'maintenance' | 'inactive' | 'sold';
  purchase_date?: string;
  purchase_price?: number;
  last_service_date?: string;
  next_service_date?: string;
  notes?: string;
  vehicle_type?: VehicleType;
  created_at: string;
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

export const vehicleService = {
  async getAll() {
    const response = await api.get('/vehicles');
    return response.data;
  },

  async getOne(id: number) {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  async create(data: Partial<Vehicle>) {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  async update(id: number, data: Partial<Vehicle>) {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
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
