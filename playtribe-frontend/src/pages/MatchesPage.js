import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createMatch, getMatches } from '../services/matchService';
import { createMatchJoinRequest, getMyMatchRequests, getMatchRequests } from '../services/matchRequestService';
import { useAuth } from '../context/AuthContext';
import { getUploadUrl } from '../services/api';

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
    startTime: '',
    endTime: '',
    city: '',
    maxPlayers: 10,
    latitude: '',
    longitude: '',
    locationUrl: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [myMatchRequests, setMyMatchRequests] = useState([]);
  const [allMatchRequests, setAllMatchRequests] = useState([]);
  const normalizeStatus = (status) => String(status || '').toLowerCase();
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const getMatchSchedule = (match) => {
    const dateString = new Date(match.date).toISOString().split('T')[0];
    const start = match.startTime || match.time || '';
    const end = match.endTime || match.time || '';
    const startDateTime = start ? new Date(`${dateString}T${start}:00`) : null;
    const endDateTime = end ? new Date(`${dateString}T${end}:00`) : null;

    return { start, end, startDateTime, endDateTime };
  };

  const getMatchStatus = (match) => {
    const { startDateTime, endDateTime } = getMatchSchedule(match);
    const current = new Date();

    if (startDateTime && !Number.isNaN(startDateTime.getTime())) {
      if (endDateTime && !Number.isNaN(endDateTime.getTime()) && current > endDateTime) {
        return { label: 'Ended', className: 'tag tag-ended' };
      }
      if (endDateTime && !Number.isNaN(endDateTime.getTime()) && current >= startDateTime && current <= endDateTime) {
        return { label: 'Running', className: 'tag tag-running' };
      }
    }

    return { label: 'Upcoming', className: 'tag tag-upcoming' };
  };

  const fetchMatches = useCallback(async (activeFilters = {}) => {
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
  }, []);

  const fetchMyMatchRequests = useCallback(async () => {
    try {
      const requests = await getMyMatchRequests();
      setMyMatchRequests(requests);
    } catch (err) {
      console.log('Failed to fetch match requests:', err);
    }
  }, []);

  const fetchAllMatchRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      const userMatches = matches.filter((match) => {
        const creatorId = match?.creator?._id || match?.creator;
        return creatorId && user?._id && String(creatorId) === String(user._id);
      });
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
  }, [user, matches]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        sport: user.sport || '',
        city: user.city || ''
      }));
      fetchMyMatchRequests();
    }
  }, [user, fetchMyMatchRequests]);

  useEffect(() => {
    if (user && matches.length > 0) {
      fetchAllMatchRequests();
    }
  }, [user, matches, fetchAllMatchRequests]);

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
      const selectedStartDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
      const selectedEndDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

      if (Number.isNaN(selectedStartDateTime.getTime()) || Number.isNaN(selectedEndDateTime.getTime())) {
        setFormError('Please select a valid date and time.');
        return;
      }

      if (selectedStartDateTime <= new Date()) {
        setFormError('Please select a future start time for the match.');
        return;
      }

      if (selectedEndDateTime <= selectedStartDateTime) {
        setFormError('End time must be later than start time.');
        return;
      }

      const payload = {
        ...formData,
        maxPlayers: Number(formData.maxPlayers),
      };
      const newMatch = await createMatch(payload);
      setMatches((prev) => [newMatch, ...prev]);
      setFormData({
        sport: '',
        date: '',
        startTime: '',
        endTime: '',
        city: '',
        maxPlayers: 10,
        latitude: '',
        longitude: '',
        locationUrl: '',
      });
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
              const participants = (match.participants || []).filter(Boolean);
              const currentPlayers = participants.length;
              const full = currentPlayers >= match.maxPlayers;
              const hasRequested = myMatchRequests.some(
                req => {
                  const reqMatchId = req?.match?._id || req?.match;
                  if (!reqMatchId) return false;

                  console.log('Match request comparison:', reqMatchId, 'vs match._id:', match._id);
                  console.log('Match request status:', req.status);
                  console.log('Type comparison:', typeof reqMatchId, typeof match._id);
                  const matchIdMatch =
                    String(reqMatchId) === String(match._id);
                  console.log('Match ID match:', matchIdMatch);
                  return matchIdMatch && normalizeStatus(req.status) === 'pending';
                }
              );
              const isParticipant = participants.some((p) => {
                const participantId = p?._id || p;
                return participantId && user?._id && String(participantId) === String(user._id);
              });
              const creatorId = match?.creator?._id || match?.creator;
              const isCreator = creatorId && user?._id && String(creatorId) === String(user._id);
              const schedule = getMatchSchedule(match);
              const status = getMatchStatus(match);
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
                      {match.city} - {new Date(match.date).toLocaleDateString()} |{' '}
                      {schedule.start} to {schedule.end}
                    </p>
                  </div>
                  <div className="match-meta">
                    <div className="creator-info">
                      {match.creator?.profileImage ? (
                        <img 
                          src={getUploadUrl(match.creator.profileImage)} 
                          alt={match.creator?.name || 'Match creator'}
                          className="creator-avatar"
                        />
                      ) : (
                        <div className="creator-avatar-placeholder">
                          {match.creator?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <span className="creator-name">Created by {match.creator?.name}</span>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <span className={status.className}>
                      {status.label}
                    </span>
                    <span className="tag">
                      {currentPlayers}/{match.maxPlayers} players
                    </span>
                    {isCreator && (
                      <Link 
                        to={`/match/${match._id}`} 
                        className={`btn btn-small ${pendingRequestsCount > 0 ? 'requests-with-pending' : 'btn-outline'}`}
                      >
                        Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
                      </Link>
                    )}
                    {isParticipant && (
                      <Link 
                        to={`/chat/match/${match._id}`} 
                        className="btn btn-small btn-primary chat-btn"
                      >
                        💬 Chat
                      </Link>
                    )}
                    {match.locationUrl && (
                      <button
                        type="button"
                        className="btn btn-small btn-primary address-btn"
                        onClick={() => window.open(match.locationUrl, '_blank')}
                        title="Get address in Google Maps"
                      >
                        Get Address
                      </button>
                    )}
                    {!isParticipant && (
                      <button
                        type="button"
                        className={`btn btn-small ${
                          hasRequested ? 'btn-outline' : 'btn-primary'
                        }`}
                        disabled={hasRequested || full || joiningId === match._id}
                        onClick={() => handleJoinMatch(match._id)}
                      >
                        {hasRequested ? 'Request Sent' : 
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
                min={todayDate}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleFormChange}
                min={formData.date === todayDate ? currentTime : undefined}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleFormChange}
                min={formData.startTime || (formData.date === todayDate ? currentTime : undefined)}
                required
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
              <label htmlFor="locationUrl">Google Maps URL *</label>
              <input
                id="locationUrl"
                name="locationUrl"
                type="text"
                value={formData.locationUrl}
                onChange={handleFormChange}
                required
                placeholder="Paste Google Maps URL here"
              />
              <p className="location-helper">
                Paste a Google Maps URL here so others can easily find the location.
              </p>
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
