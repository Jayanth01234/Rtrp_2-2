import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createMatch, getMatches } from '../services/matchService';
import { createMatchJoinRequest, getMyMatchRequests, getMatchRequests } from '../services/matchRequestService';
import { useAuth } from '../context/AuthContext';

const MatchesPage = () => {
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [filters, setFilters] = useState({
    city: '',
    sport: '',
    skillLevel: '',
  });
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
  const [myMatchRequests, setMyMatchRequests] = useState([]);
  const [allMatchRequests, setAllMatchRequests] = useState([]);
  const normalizeStatus = (status) => String(status || '').toLowerCase();

  const fetchMatches = async (activeFilters = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await getMatches(activeFilters);
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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        sport: user.sport || '',
        city: user.city || ''
      }));
      fetchMyMatchRequests();
    }
  }, [user]);

  useEffect(() => {
    if (user && matches.length > 0) {
      fetchAllMatchRequests();
    }
  }, [user, matches]);

  const fetchMyMatchRequests = async () => {
    try {
      const requests = await getMyMatchRequests();
      setMyMatchRequests(requests);
    } catch (err) {
      console.log('Failed to fetch match requests:', err);
    }
  };

  const fetchAllMatchRequests = async () => {
    if (!user) return;
    
    try {
      // Get requests for all matches created by this user
      const userMatches = matches.filter(match => match.creator._id === user._id);
      const allRequests = [];
      
      for (const match of userMatches) {
        try {
          const matchRequests = await getMatchRequests(match._id);
          allRequests.push(...matchRequests);
        } catch (err) {
          console.log('Failed to fetch requests for match:', match._id);
        }
      }
      
      setAllMatchRequests(allRequests);
    } catch (err) {
      console.log('Failed to fetch all match requests:', err);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchMatches(filters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    const emptyFilters = { city: '', sport: '', skillLevel: '' };
    setFilters(emptyFilters);
    fetchMatches(emptyFilters);
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
      // Fetch requests after creating a new match
      setTimeout(() => fetchAllMatchRequests(), 100);
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
      console.log('Creating match join request for match:', matchId);
      const response = await createMatchJoinRequest(matchId);
      console.log('Match join request response:', response);
      await fetchMyMatchRequests();
      await fetchAllMatchRequests();
      alert('Join request sent successfully!');
    } catch (err) {
      console.log('Match join request error:', err);
      console.log('Error response:', err.response?.data);
      const message =
        err.response?.data?.message || 'Failed to send join request. Please try again.';
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
          {user && (
            <div className="user-context">
              <p className="muted">
                Playing as <strong>{user.name}</strong> in {user.city} 
                {user.sport && ` (${user.sport}, ${user.skillLevel})`}
              </p>
            </div>
          )}
          <form className="inline-form" onSubmit={handleFilterSubmit}>
            <input
              type="text"
              name="city"
              placeholder="Filter by city"
              value={filters.city}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="sport"
              placeholder="Filter by sport"
              value={filters.sport}
              onChange={handleFilterChange}
            />
            <select
              name="skillLevel"
              value={filters.skillLevel}
              onChange={handleFilterChange}
            >
              <option value="">All skill levels</option>
              {skillLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-outline">
              Filter
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear
            </button>
          </form>

          {loading && <p>Loading matches...</p>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="list">
            {matches.map((match) => {
              const currentPlayers = match.participants ? match.participants.length : 0;
              const full = currentPlayers >= match.maxPlayers;
              const hasRequested = myMatchRequests.some(
                req => {
                  console.log('Match request comparison:', req.match._id, 'vs match._id:', match._id);
                  console.log('Match request status:', req.status);
                  console.log('Type comparison:', typeof req.match._id, typeof match._id);
                  // Try both string comparison and object comparison
                  const matchIdMatch = req.match._id === match._id || 
                                       req.match._id?.toString() === match._id?.toString() ||
                                       String(req.match._id) === String(match._id);
                  console.log('Match ID match:', matchIdMatch);
                  return matchIdMatch && normalizeStatus(req.status) === 'pending';
                }
              );
              const isParticipant = match.participants?.some(
                p => p._id === user?._id || p === user?._id
              );
              const isCreator = match.creator._id === user?._id;
              const pendingRequestsCount = allMatchRequests.filter(
                req => {
                  const requestMatchId = String(req.match?._id || req.match);
                  const currentMatchId = String(match._id);
                  return requestMatchId === currentMatchId && normalizeStatus(req.status) === 'pending';
                }
              ).length;
              console.log('Match hasRequested:', hasRequested, 'isCreator:', isCreator, 'pendingRequestsCount:', pendingRequestsCount);
              
              return (
                <div key={match._id} className="list-item">
                  <div>
                    <h3>
                      <Link to={`/match/${match._id}`} className="team-link">
                        {match.sport}
                      </Link>
                    </h3>
                    <p className="muted">
                      {match.city} - {new Date(match.date).toLocaleDateString()} at{' '}
                      {match.time}
                    </p>
                  </div>
                  <div className="match-meta">
                    <div className="creator-info">
                      {match.creator?.profileImage ? (
                        <img 
                          src={`http://localhost:5000/uploads/${match.creator.profileImage}`} 
                          alt={match.creator.name}
                          className="creator-avatar"
                        />
                      ) : (
                        <div className="creator-avatar-placeholder">
                          {match.creator.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <span className="creator-name">Created by {match.creator?.name}</span>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <span className="tag">
                      {currentPlayers}/{match.maxPlayers} players
                    </span>
                    {match.creator._id === user?._id && (
                      <Link 
                        to={`/match/${match._id}`} 
                        className={`btn btn-small ${pendingRequestsCount > 0 ? 'requests-with-pending' : 'btn-outline'}`}
                      >
                        Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
                      </Link>
                    )}
                    {!isCreator && (
                      <button
                        type="button"
                        className={`btn btn-small ${
                          isParticipant ? 'btn-secondary' : 
                          hasRequested ? 'btn-outline' : 'btn-primary'
                        }`}
                        disabled={isParticipant || hasRequested || full || joiningId === match._id}
                        onClick={() => handleJoinMatch(match._id)}
                      >
                        {isParticipant ? 'Joined' : 
                         hasRequested ? 'Request Sent' : 
                         full ? 'Full' :
                         joiningId === match._id ? 'Joining...' : 'Request to Join'}
                      </button>
                    )}
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
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleFormChange}
                required
              />
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
                name="maxPlayers"
                type="number"
                min="2"
                value={formData.maxPlayers}
                onChange={handleFormChange}
                required
              />
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
