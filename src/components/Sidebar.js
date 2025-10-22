import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '🏠 Dashboard', id: 'dashboard' },
    { path: '/devices', label: '🔧 Device Management', id: 'devices' },
    { path: '/telemetry', label: '📊 Telemetry & Charts', id: 'telemetry' },
    { path: '/alerts', label: '🚨 Active Alerts', id: 'alerts' },
    { path: '/logs', label: '📋 System Logs', id: 'logs' },
    { path: '/reports', label: '📈 Reports', id: 'reports' },
    { path: '/settings', label: '⚙️ Settings', id: 'settings' }
  ];

  return (
    <div className="sidebar">
      {navItems.map(item => (
        <Link
          key={item.id}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;