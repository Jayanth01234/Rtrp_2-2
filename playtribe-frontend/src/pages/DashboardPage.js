import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/api/users/profile');
        setUser(response.data.user || response.data);
      } catch (err) {
        const message =
          err.response?.data?.message || 'Failed to load profile. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, setUser]);

  const profile = user;

  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <section className="card">
          <h2>Player Profile</h2>
          {loading && <p>Loading profile...</p>}
          {error && <div className="alert alert-error">{error}</div>}
          {profile && !loading && (
            <div className="profile-grid">
              <div>
                <h3>{profile.name}</h3>
                <p className="muted">{profile.email}</p>
              </div>
              <div className="profile-meta">
                <div>
                  <span className="label">City</span>
                  <span>{profile.city}</span>
                </div>
                <div>
                  <span className="label">Preferred Sport</span>
                  <span>{profile.preferredSport}</span>
                </div>
                <div>
                  <span className="label">Skill Level</span>
                  <span>{profile.skillLevel}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="card card-highlight">
          <h2>Get in the game</h2>
          <p>Navigate to Teams to find or create a squad, or to Matches to join upcoming games.</p>
          <div className="card-actions">
            <a href="/teams" className="btn btn-primary">
              Explore Teams
            </a>
            <a href="/matches" className="btn btn-outline">
              Explore Matches
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;

