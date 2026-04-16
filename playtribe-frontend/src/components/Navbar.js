import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        </nav>
      </div>
      <div className="navbar-right">
        {user && <span className="navbar-user">Hi, {user.name}</span>}
        <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;

