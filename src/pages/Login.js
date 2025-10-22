import React, { useState } from 'react';
import Signup from './Signup';
import api from '../services/api';

const Login = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendLoginOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/send-login-otp', { email });
      if (response.data.success) {
        setStep(2);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-login', { email, otp });
      
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

  if (showSignup) {
    return <Signup onBackToLogin={() => setShowSignup(false)} />;
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">🏭 Voltas BMS Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={sendLoginOTP}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyLoginOTP}>
            <div className="otp-info">
              <p>📧 OTP sent to <strong>{email}</strong></p>
              <p>Check your email and enter the 6-digit code:</p>
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
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setStep(1)}
              style={{marginTop: '1rem'}}
            >
              Back to Email
            </button>
          </form>
        )}
        
        <div className="auth-switch">
          <p>Don't have an account? 
            <button 
              type="button" 
              className="link-btn" 
              onClick={() => setShowSignup(true)}
            >
              Sign Up
            </button>
          </p>
        </div>
        
        <div className="demo-info">
          <h4>🔑 Demo Account</h4>
          <p><strong>Email:</strong> admin@voltas.com</p>
          <p><small>Use this for demo login (OTP will be sent)</small></p>
        </div>
      </div>
    </div>
  );
};

export default Login;