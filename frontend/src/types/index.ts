export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'guest';
  created_at: string;
}

export interface Device {
  id: number;
  device_id: string;
  name: string;
  protocol: 'Modbus' | 'BACnet';
  ip: string;
  port: number;
  location?: string;
  description?: string;
  is_active: boolean;
  is_online: boolean;
  last_heartbeat?: string;
  telemetry: Record<string, number>;
  created_at: string;
}

export interface Telemetry {
  id: number;
  device_id: number;
  metric_name: string;
  metric_value: number;
  timestamp: string;
}

export interface Alert {
  id: number;
  device_id: number;
  device_name: string;
  rule_json: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_by?: number;
  ack_at?: string;
}

export interface Command {
  id: number;
  device_id: number;
  command_type: string;
  payload?: string;
  status: 'pending' | 'executed' | 'failed';
  issued_by: number;
  timestamp: string;
}

export interface Log {
  id: number;
  device_id?: number;
  device_name?: string;
  event_type: string;
  message: string;
  user_id?: number;
  user_name?: string;
  timestamp: string;
}

export interface DashboardStats {
  total_devices: number;
  active_devices: number;
  online_devices: number;
  active_alerts: number;
  avg_co2_ppm: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface DeviceCreate {
  device_id: string;
  name: string;
  protocol: 'Modbus' | 'BACnet';
  ip: string;
  port: number;
  location?: string;
  description?: string;
  is_active?: boolean;
}

export interface DeviceUpdate {
  name?: string;
  protocol?: 'Modbus' | 'BACnet';
  ip?: string;
  port?: number;
  location?: string;
  description?: string;
  is_active?: boolean;
}

export interface CommandCreate {
  device_id: number;
  command_type: string;
  payload?: string;
}