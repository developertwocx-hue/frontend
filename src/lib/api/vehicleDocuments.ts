import api from '../api';

export interface DocumentType {
  id: number;
  name: string;
  description: string | null;
  vehicle_type_id: number | null;
  tenant_id: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  scope_type: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleDocument {
  id: number;
  tenant_id: string;
  vehicle_id: number;
  document_type_id: number;
  document_type: string | DocumentType;
  document_name: string;
  document_number: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  issue_date: string | null;
  expiry_date: string | null;
  is_expired: boolean;
  notes: string | null;
  uploaded_by: number | null;
  created_at: string;
  updated_at: string;
  document_type_info?: DocumentType;
  documentType?: DocumentType; // Relationship from backend
  vehicle?: {
    id: number;
    name: string;
  };
}

export interface CreateDocumentData {
  vehicle_id: number;
  document_type_id: number;
  document_name: string;
  document_number?: string;
  file: File;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
}

export interface UpdateDocumentData {
  document_type_id?: number;
  document_name?: string;
  document_number?: string;
  file?: File;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
}

// Get all document types
export const getDocumentTypes = async (vehicleTypeId?: number) => {
  const params = vehicleTypeId ? { vehicle_type_id: vehicleTypeId } : {};
  const response = await api.get('/document-types', { params });
  return response.data.data as DocumentType[];
};

// Get document types for a specific vehicle
export const getDocumentTypesForVehicle = async (vehicleId: number) => {
  const response = await api.get(`/vehicles/${vehicleId}/document-types`);
  return response.data.data as DocumentType[];
};

// Get all documents for a vehicle
export const getVehicleDocuments = async (vehicleId: number) => {
  const response = await api.get(`/vehicles/${vehicleId}/documents`);
  return response.data.data as VehicleDocument[];
};

// Get all documents (across all vehicles)
export const getAllDocuments = async () => {
  const response = await api.get('/documents');
  return response.data.data as VehicleDocument[];
};

// Get single document
export const getVehicleDocument = async (vehicleId: number, documentId: number) => {
  const response = await api.get(`/vehicles/${vehicleId}/documents/${documentId}`);
  return response.data.data as VehicleDocument;
};

// Create document with file upload
export const createVehicleDocument = async (vehicleId: number, data: CreateDocumentData) => {
  const formData = new FormData();
  formData.append('document_type_id', data.document_type_id.toString());
  formData.append('document_name', data.document_name);
  if (data.document_number) formData.append('document_number', data.document_number);
  formData.append('file', data.file);
  if (data.issue_date) formData.append('issue_date', data.issue_date);
  if (data.expiry_date) formData.append('expiry_date', data.expiry_date);
  if (data.notes) formData.append('notes', data.notes);

  const response = await api.post(`/vehicles/${vehicleId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data as VehicleDocument;
};

// Update document
export const updateVehicleDocument = async (
  vehicleId: number,
  documentId: number,
  data: UpdateDocumentData
) => {
  const formData = new FormData();
  if (data.document_type_id) formData.append('document_type_id', data.document_type_id.toString());
  if (data.document_name) formData.append('document_name', data.document_name);
  if (data.document_number) formData.append('document_number', data.document_number);
  if (data.file) formData.append('file', data.file);
  if (data.issue_date) formData.append('issue_date', data.issue_date);
  if (data.expiry_date) formData.append('expiry_date', data.expiry_date);
  if (data.notes) formData.append('notes', data.notes);

  formData.append('_method', 'PUT');

  const response = await api.post(
    `/vehicles/${vehicleId}/documents/${documentId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data as VehicleDocument;
};

// Delete document
export const deleteVehicleDocument = async (vehicleId: number, documentId: number) => {
  const response = await api.delete(`/vehicles/${vehicleId}/documents/${documentId}`);
  return response.data;
};

// Download document
export const downloadDocument = (filePath: string) => {
  // Assuming files are served from Laravel's public storage
  const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseURL}/storage/${filePath}`;
};
