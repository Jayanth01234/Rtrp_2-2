import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-brand">PlayTribe</span>
        <nav>
          <Link to="/dashboard" className={isActive('/dashboard')}>
            Dashboard
          </Link>
          <Link to="/teams" className={isActive('/teams')}>
            Teams
          </Link>
          <Link to="/matches" className={isActive('/matches')}>
            Matches
          </Link>
          <Link to="/profile" className={isActive('/profile')}>
            Profile
          </Link>
        </nav>
      </div>
      <div className="navbar-right">
        {user && <NotificationBell />}
        {user && (
          <div className="navbar-user-section">
            {user.profileImage ? (
              <img 
                src={`http://localhost:5000/uploads/${user.profileImage}`} 
                alt={user.name}
                className="navbar-avatar"
              />
            ) : (
              <div className="navbar-avatar-placeholder">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="navbar-user">Hi, {user.name}</span>
          </div>
        )}
        <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;

