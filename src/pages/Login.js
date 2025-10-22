import React, { useState } from 'react';
import Signup from './Signup';
import api from '../services/api';

const Login = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.reload();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid credentials');
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
        <h2 className="login-title">🏭 BMS Dashboard Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
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
          <p><strong>Password:</strong> admin123</p>
          <p><small>Use these credentials for demo login</small></p>
        </div>
      </div>
    </div>
  );
};

export default Login;