import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    activeAlerts: 0,
    avgTemperature: 0
  });
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [devicesRes, alertsRes] = await Promise.all([
        api.get('/devices'),
        api.get('/alerts')
      ]);

      const devicesData = devicesRes.data;
      const alertsData = alertsRes.data;

      setDevices(devicesData);
      
      const onlineCount = devicesData.filter(d => d.isOnline).length;
      const activeAlertCount = alertsData.filter(a => a.status === 'active').length;
      const avgTemp = devicesData.reduce((sum, d) => sum + (d.telemetry?.temperature || 0), 0) / devicesData.length;

      setStats({
        totalDevices: devicesData.length,
        onlineDevices: onlineCount,
        activeAlerts: activeAlertCount,
        avgTemperature: avgTemp.toFixed(1)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Dashboard Overview</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number" style={{color: '#3b82f6'}}>{stats.totalDevices}</div>
          <div className="stat-label">Total Devices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{color: '#10b981'}}>{stats.onlineDevices}</div>
          <div className="stat-label">Online Devices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{color: '#ef4444'}}>{stats.activeAlerts}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{color: '#f59e0b'}}>{stats.avgTemperature}°C</div>
          <div className="stat-label">Avg Temperature</div>
        </div>
      </div>

      <div className="devices-section">
        <h2>🌡️ Device Monitoring</h2>
        <div className="devices-grid">
          {devices.map(device => (
            <div key={device._id} className="device-card">
              <div className="device-header">
                <div className="device-name">{device.name}</div>
                <div className={`device-status status-${device.isOnline ? 'online' : 'offline'}`}>
                  {device.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </div>
              </div>
              <p className="device-location">{device.location}</p>
              <div className="device-metrics">
                <div className="metric">
                  <div className="metric-value">{device.telemetry?.temperature || 0}°C</div>
                  <div className="metric-label">Temperature</div>
                </div>
                <div className="metric">
                  <div className="metric-value">{device.telemetry?.co2_ppm || 0}</div>
                  <div className="metric-label">CO2 (ppm)</div>
                </div>
                <div className="metric">
                  <div className="metric-value">{device.telemetry?.humidity || 0}%</div>
                  <div className="metric-label">Humidity</div>
                </div>
                <div className="metric">
                  <div className="metric-value">{device.telemetry?.power_kw || 0}kW</div>
                  <div className="metric-label">Power</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;