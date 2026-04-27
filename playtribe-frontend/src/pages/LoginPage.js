import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Submitting login data:', { email, password: '***' });
    
    try {
      const data = await loginService({ email, password });
      console.log('Login response:', data);
      if (data && data.token) {
        login(
          { _id: data._id, name: data.name, email: data.email },
          data.token
        );
        navigate('/dashboard');
      } else {
        console.log('Unexpected response:', data);
        setError('Unexpected response from server.');
      }
    } catch (err) {
      console.log('Login error:', err);
      console.log('Error response:', err.response?.data);
      const message =
        err.response?.data?.message || 'Failed to login. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="brand-title">PlayTribe</h1>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Log in to find teams and matches near you.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          New to PlayTribe? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

