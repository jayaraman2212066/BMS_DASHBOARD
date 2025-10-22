import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading alerts...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Active Alerts</h1>
      
      {alerts.length === 0 ? (
        <div className="no-data">No active alerts</div>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert._id} className={`alert-item severity-${alert.severity}`}>
              <div className="alert-header">
                <h3>{alert.deviceId?.name || 'Unknown Device'}</h3>
                <span className={`alert-severity ${alert.severity}`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p className="alert-message">{alert.message}</p>
              <div className="alert-footer">
                <span>🕒 {new Date(alert.createdAt).toLocaleString()}</span>
                <span className={`alert-status ${alert.status}`}>
                  {alert.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;