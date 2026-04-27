import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createTeam, getTeams } from '../services/teamService';
import { createJoinRequest, getMyRequests, getTeamRequests } from '../services/requestService';
import { useAuth } from '../context/AuthContext';

const TeamsPage = () => {
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({
    city: '',
    sport: '',
    skillLevel: '',
  });
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
  const [myRequests, setMyRequests] = useState([]);
  const [allTeamRequests, setAllTeamRequests] = useState([]);
  const normalizeStatus = (status) => String(status || '').toLowerCase();

  const fetchTeams = async (activeFilters = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTeams(activeFilters);
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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        sport: user.sport || '',
        city: user.city || ''
      }));
      fetchMyRequests();
    }
  }, [user]);

  useEffect(() => {
    if (user && teams.length > 0) {
      fetchAllTeamRequests();
    }
  }, [user, teams]);

  const fetchMyRequests = async () => {
    try {
      console.log('Fetching user requests from API...');
      const requests = await getMyRequests();
      setMyRequests(requests);
    } catch (err) {
      console.log('Failed to fetch user requests:', err);
    }
  };

  const fetchAllTeamRequests = async () => {
    if (!user) return;
    
    try {
      // Get requests for all teams created by this user
      const userTeams = teams.filter(team => team.admin._id === user._id);
      const allRequests = [];
      
      for (const team of userTeams) {
        try {
          const teamRequests = await getTeamRequests(team._id);
          allRequests.push(...teamRequests);
        } catch (err) {
          console.log('Failed to fetch requests for team:', team._id);
        }
      }
      
      setAllTeamRequests(allRequests);
    } catch (err) {
      console.log('Failed to fetch all team requests:', err);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchTeams(filters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    const emptyFilters = { city: '', sport: '', skillLevel: '' };
    setFilters(emptyFilters);
    fetchTeams(emptyFilters);
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
      // Fetch requests after creating a new team
      setTimeout(() => fetchAllTeamRequests(), 100);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to create team. Please try again.';
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    console.log('=== TEAM JOIN REQUEST START ===');
    console.log('Joining team - Team ID:', teamId);
    console.log('Current user:', user?.name, user?.id);
    console.log('Current myRequests before:', myRequests);
    
    setJoinError('');
    setJoinSuccess('');
    try {
      console.log('Calling createJoinRequest with teamId:', teamId);
      const response = await createJoinRequest(teamId);
      console.log('Join request response:', response);
      setJoinSuccess(`Join request sent as ${user.name} (${user.city}, ${user.sport})`);
      
      // Immediately refresh user requests
      console.log('Refreshing user requests...');
      await fetchMyRequests();
      await fetchAllTeamRequests();
    } catch (err) {
      console.log('Join request error:', err);
      console.log('Error response:', err.response?.data);
      const message =
        err.response?.data?.message || 'Failed to send join request. Please try again.';
      setJoinError(message);
    }
    console.log('=== TEAM JOIN REQUEST END ===');
  };

  return (
    <div className="page">
      <Navbar />
      <main className="page-content page-grid">
        <section className="card">
          <h2>Teams</h2>
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

          {loading && <p>Loading teams...</p>}
          {error && <div className="alert alert-error">{error}</div>}
          {joinError && <div className="alert alert-error">{joinError}</div>}
          {joinSuccess && <div className="alert alert-success">{joinSuccess}</div>}

          <div className="list">
            {teams.map((team) => {
              console.log('Rendering team:', team.name, 'ID:', team._id);
              console.log('My requests:', myRequests);
              console.log('Current team ID:', team._id);
              console.log('Team object:', team);
              const isMember = team.members?.some(
                (m) => m._id === user?._id || m === user?._id
              );
              const hasRequested = myRequests.some(
                req => {
                  // Convert both to strings for reliable comparison
                  const requestTeamId = String(req.team._id || req.team);
                  const currentTeamId = String(team._id);
                  console.log('Team request comparison:', requestTeamId, 'vs', currentTeamId);
                  console.log('Request status:', req.status);
                  const isMatch = requestTeamId === currentTeamId && normalizeStatus(req.status) === 'pending';
                  console.log('Team request matches:', isMatch);
                  return isMatch;
                }
              );
              console.log('Has requested for this team:', hasRequested);
              const isAdmin = team.admin._id === user?._id;
              const pendingRequestsCount = allTeamRequests.filter(
                req => {
                  const requestTeamId = String(req.team._id || req.team);
                  const currentTeamId = String(team._id);
                  return requestTeamId === currentTeamId && normalizeStatus(req.status) === 'pending';
                }
              ).length;

              return (
                <div key={team._id} className="list-item">
                  <div>
                    <h3>
                      <Link to={`/team/${team._id}`} className="team-link">
                        {team.name}
                      </Link>
                    </h3>
                    <p className="muted">
                      {team.sport} • {team.city}
                    </p>
                    {team.description && <p>{team.description}</p>}
                  </div>
                  <div className="team-meta">
                    <div className="creator-info">
                      {team.admin?.profileImage ? (
                        <img 
                          src={`http://localhost:5000/uploads/${team.admin.profileImage}`} 
                          alt={team.admin.name}
                          className="creator-avatar"
                        />
                      ) : (
                        <div className="creator-avatar-placeholder">
                          {team.admin.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <span className="creator-name">Created by {team.admin?.name}</span>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <span className="tag">
                      Members: {team.members ? team.members.length : 0}
                    </span>
                    {isAdmin && (
                      <Link 
                        to={`/team/${team._id}`} 
                        className={`btn btn-small ${pendingRequestsCount > 0 ? 'requests-with-pending' : 'btn-outline'}`}
                      >
                        Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
                      </Link>
                    )}
                    {!isAdmin && (
                      <button
                        type="button"
                        className={`btn btn-small ${
                          isMember ? 'btn-secondary' : 
                          hasRequested ? 'btn-outline' : 'btn-primary'
                        }`}
                        disabled={isMember || hasRequested}
                        onClick={() => handleJoinTeam(team._id)}
                      >
                        {isMember ? 'Joined' : 
                         hasRequested ? 'Request Sent' : 'Request to Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
                placeholder="Enter team name"
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
                placeholder="Enter sport"
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
                placeholder="Enter city"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Brief description of your team"
                rows="3"
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

