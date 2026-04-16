import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { createTeam, getTeams } from '../services/teamService';
import { createJoinRequest } from '../services/requestService';
import { useAuth } from '../context/AuthContext';

const TeamsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    city: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const fetchTeams = async (city) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTeams(city);
      setTeams(data);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to load teams. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchTeams(cityFilter || undefined);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const newTeam = await createTeam(formData);
      setTeams((prev) => [newTeam, ...prev]);
      setFormData({ name: '', sport: '', city: '', description: '' });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to create team. Please try again.';
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    setJoinError('');
    setJoinSuccess('');
    try {
      await createJoinRequest(teamId);
      setJoinSuccess('Successfully sent join request!');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to send join request. Please try again.';
      setJoinError(message);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="page-content page-grid">
        <section className="card">
          <h2>Teams</h2>
          <form className="inline-form" onSubmit={handleFilterSubmit}>
            <input
              type="text"
              placeholder="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
            <button type="submit" className="btn btn-outline">
              Filter
            </button>
          </form>

          {loading && <p>Loading teams...</p>}
          {error && <div className="alert alert-error">{error}</div>}
          {joinError && <div className="alert alert-error">{joinError}</div>}
          {joinSuccess && <div className="alert alert-success">{joinSuccess}</div>}

          <div className="list">
            {teams.map((team) => (
              <div key={team._id} className="list-item">
                <div>
                  <h3>{team.name}</h3>
                  <p className="muted">
                    {team.sport} • {team.city}
                  </p>
                  {team.description && <p>{team.description}</p>}
                </div>
                <div className="list-item-actions">
                  {(() => {
                    const isMember = team.members?.some(
                      (m) => m._id === user?._id || m === user?._id
                    );
                    return (
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        disabled={isMember}
                        onClick={() => handleJoinTeam(team._id)}
                      >
                        {isMember ? 'Joined' : 'Join team'}
                      </button>
                    );
                  })()}
                  <span className="tag">
                    Members: {team.members ? team.members.length : 0}
                  </span>
                </div>
              </div>
            ))}
            {!loading && teams.length === 0 && <p>No teams found.</p>}
          </div>
        </section>

        <section className="card">
          <h2>Create a team</h2>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form className="form" onSubmit={handleCreateTeam}>
            <div className="form-group">
              <label htmlFor="name">Team name</label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                placeholder="e.g. Sunday Strikers"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sport">Sport</label>
              <input
                id="sport"
                name="sport"
                value={formData.sport}
                onChange={handleFormChange}
                required
                placeholder="Football, Cricket..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                required
                placeholder="e.g. Bangalore"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Short intro about your team"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create team'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default TeamsPage;

