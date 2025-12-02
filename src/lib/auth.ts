import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
    };
    token: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.data.token) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    if (response.data.data.token) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },

  async googleLogin(): Promise<void> {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/google/redirect`;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },
};
