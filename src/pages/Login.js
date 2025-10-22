import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@voltas.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">🏭 Voltas BMS Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="demo-info">
          <h4>🔑 Demo Credentials</h4>
          <p><strong>Admin:</strong> admin@voltas.com / admin123</p>
          <p><strong>Operator:</strong> operator@voltas.com / operator123</p>
          <p><strong>Guest:</strong> guest@voltas.com / guest123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;