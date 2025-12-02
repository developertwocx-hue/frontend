import api from './api';

export interface BusinessRegistration {
  business_name: string;
  business_email: string;
  business_phone?: string;
  business_address?: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirmation: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  subscription_plan: string;
  subscription_ends_at: string;
  created_at: string;
}

export const tenantService = {
  async registerBusiness(data: BusinessRegistration) {
    const response = await api.post('/tenants/register', data);
    if (response.data.data.token) {
      localStorage.setItem('auth_token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      localStorage.setItem('tenant', JSON.stringify(response.data.data.tenant));
    }
    return response.data;
  },

  async getCurrentTenant() {
    const response = await api.get('/tenant');
    return response.data;
  },

  async updateTenant(data: Partial<Tenant>) {
    const response = await api.put('/tenant', data);
    return response.data;
  },
};
