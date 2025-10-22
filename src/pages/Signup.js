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

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/send-signup-otp', formData);
      if (response.data.success) {
        setStep(2);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
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
        
        {step === 1 ? (
          <form onSubmit={sendOTP}>
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
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP}>
            <div className="otp-info">
              <p>📧 OTP sent to <strong>{formData.email}</strong></p>
              <p>Check your email and enter the 6-digit code below:</p>
            </div>
            
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength="6"
                required
                className="otp-input"
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setStep(1)}
              style={{marginTop: '1rem'}}
            >
              Back to Form
            </button>
          </form>
        )}
        
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
            <p>Admin Key: <code>VOLTAS_ADMIN_2024</code></p>
            <p><small>This is for demo purposes only</small></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;