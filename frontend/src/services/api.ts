import axios from 'axios';
import { 
  AuthResponse, 
  LoginCredentials, 
  Device, 
  DeviceCreate, 
  DeviceUpdate,
  Telemetry,
  Alert,
  Command,
  CommandCreate,
  Log,
  DashboardStats
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
};

export const deviceAPI = {
  getAll: async (): Promise<Device[]> => {
    const response = await api.get('/api/devices');
    return response.data;
  },

  getById: async (id: number): Promise<Device> => {
    const response = await api.get(`/api/devices/${id}`);
    return response.data;
  },

  create: async (device: DeviceCreate): Promise<Device> => {
    const response = await api.post('/api/devices', device);
    return response.data;
  },

  update: async (id: number, device: DeviceUpdate): Promise<Device> => {
    const response = await api.put(`/api/devices/${id}`, device);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/devices/${id}`);
  },
};

export const telemetryAPI = {
  get: async (params: {
    device_id?: number;
    metric?: string;
    start?: string;
    end?: string;
  }): Promise<Telemetry[]> => {
    const response = await api.get('/api/telemetry', { params });
    return response.data;
  },
};

export const alertAPI = {
  getAll: async (): Promise<Alert[]> => {
    const response = await api.get('/api/alerts');
    return response.data;
  },

  acknowledge: async (id: number): Promise<void> => {
    await api.post(`/api/alerts/${id}/acknowledge`);
  },
};

export const commandAPI = {
  send: async (command: CommandCreate): Promise<Command> => {
    const response = await api.post('/api/commands', command);
    return response.data;
  },
};

export const logAPI = {
  getAll: async (): Promise<Log[]> => {
    const response = await api.get('/api/logs');
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/dashboard');
    return response.data;
  },
};

export default api;