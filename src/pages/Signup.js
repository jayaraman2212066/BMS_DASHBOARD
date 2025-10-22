import React, { useState } from 'react';
import api from '../services/api';

const Signup = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
    adminKey: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/signup', formData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.reload();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-signup', {
        ...formData,
        otp
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.reload();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">🏭 Create Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={createAccount}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="guest">Guest</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {formData.role === 'admin' && (
              <div className="form-group">
                <label>Admin Key</label>
                <input
                  type="password"
                  name="adminKey"
                  value={formData.adminKey}
                  onChange={handleInputChange}
                  placeholder="Enter admin key"
                  required
                />
                <small>Contact system administrator for admin key</small>
              </div>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        
        <div className="auth-switch">
          <p>Already have an account? 
            <button 
              type="button" 
              className="link-btn" 
              onClick={onBackToLogin}
            >
              Sign In
            </button>
          </p>
        </div>
        
        {formData.role === 'admin' && (
          <div className="admin-info">
            <h4>🔑 Admin Registration</h4>
            <p>Admin Key: <code>BMS_ADMIN_2024</code></p>
            <p><small>This is for demo purposes only</small></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;