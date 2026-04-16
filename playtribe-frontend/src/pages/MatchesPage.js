import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { createMatch, getMatches, joinMatch } from '../services/matchService';

const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    sport: '',
    date: '',
    time: '',
    location: '',
    city: '',
    maxPlayers: 10,
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const fetchMatches = async (city) => {
    setLoading(true);
    setError('');
    try {
      const data = await getMatches(city);
      setMatches(data);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to load matches. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchMatches(cityFilter || undefined);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        maxPlayers: Number(formData.maxPlayers),
      };
      const newMatch = await createMatch(payload);
      setMatches((prev) => [newMatch, ...prev]);
      setFormData({
        sport: '',
        date: '',
        time: '',
        location: '',
        city: '',
        maxPlayers: 10,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to create match. Please try again.';
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoinMatch = async (matchId) => {
    setJoiningId(matchId);
    try {
      const result = await joinMatch(matchId);
      if (result && result.match) {
        setMatches((prev) =>
          prev.map((m) => (m._id === matchId ? result.match : m))
        );
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to join match. Please try again.';
      // eslint-disable-next-line no-alert
      alert(message);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="page-content page-grid">
        <section className="card">
          <h2>Matches</h2>
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

          {loading && <p>Loading matches...</p>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="list">
            {matches.map((match) => {
              const currentPlayers = match.participants ? match.participants.length : 0;
              const full = currentPlayers >= match.maxPlayers;
              return (
                <div key={match._id} className="list-item">
                  <div>
                    <h3>{match.sport}</h3>
                    <p className="muted">
                      {match.city} • {new Date(match.date).toLocaleDateString()} at{' '}
                      {match.time}
                    </p>
                    <p>{match.location}</p>
                  </div>
                  <div className="list-item-actions">
                    <span className="tag">
                      {currentPlayers}/{match.maxPlayers} players
                    </span>
                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={() => handleJoinMatch(match._id)}
                      disabled={full || joiningId === match._id}
                    >
                      {full
                        ? 'Full'
                        : joiningId === match._id
                        ? 'Joining...'
                        : 'Join match'}
                    </button>
                  </div>
                </div>
              );
            })}
            {!loading && matches.length === 0 && <p>No matches found.</p>}
          </div>
        </section>

        <section className="card">
          <h2>Create a match</h2>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form className="form" onSubmit={handleCreateMatch}>
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
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input
                  id="time"
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                required
                placeholder="e.g. City Stadium"
              />
            </div>
            <div className="form-row">
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
                <label htmlFor="maxPlayers">Max players</label>
                <input
                  id="maxPlayers"
                  type="number"
                  min="2"
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create match'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default MatchesPage;

