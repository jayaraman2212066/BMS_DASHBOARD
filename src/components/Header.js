import React from 'react';
import { useAuth } from '../services/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <div className="header">
      <div className="logo">
        <span>🏭</span>
        <span>Voltas BMS Dashboard</span>
      </div>
      <div className="user-info">
        <span>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
        <button className="btn btn-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;