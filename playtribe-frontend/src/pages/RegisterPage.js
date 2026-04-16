import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerService } from '../services/authService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    preferredSport: '',
    skillLevel: 'Beginner',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await registerService(formData);
      setSuccess('Registration successful! You can now login.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to register. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="brand-title">PlayTribe</h1>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Join local teams and matches in your city.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="e.g. Bangalore"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferredSport">Preferred Sport</label>
              <input
                id="preferredSport"
                name="preferredSport"
                value={formData.preferredSport}
                onChange={handleChange}
                required
                placeholder="Football, Cricket, Badminton..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="skillLevel">Skill Level</label>
              <select
                id="skillLevel"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

