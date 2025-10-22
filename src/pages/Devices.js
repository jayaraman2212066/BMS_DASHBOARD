import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading devices...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Device Management</h1>
      
      <div className="devices-grid">
        {devices.map(device => (
          <div key={device._id} className="device-card">
            <div className="device-header">
              <div className="device-name">{device.name}</div>
              <div className={`device-status status-${device.isOnline ? 'online' : 'offline'}`}>
                {device.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </div>
            </div>
            
            <div className="device-details">
              <p><strong>Device ID:</strong> {device.deviceId}</p>
              <p><strong>Protocol:</strong> {device.protocol}</p>
              <p><strong>IP Address:</strong> {device.ip}:{device.port}</p>
              <p><strong>Location:</strong> {device.location}</p>
            </div>

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
  );
};

export default Devices;