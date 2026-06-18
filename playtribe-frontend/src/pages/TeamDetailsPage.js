import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getTeamRequests, updateRequestStatus } from '../services/requestService';
import { createJoinRequest } from '../services/requestService';
import { getTeam } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import api, { getUploadUrl } from '../services/api';

const TeamDetailsPage = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const fetchTeamData = useCallback(async () => {
    console.log('Fetching team data - Team ID:', teamId);
    console.log('Current user:', user?.name, user?._id);
    
    try {
      const teamData = await getTeam(teamId);
      console.log('Team data received:', teamData);
      setTeam(teamData);

      if (user?._id === teamData.admin._id) {
        console.log('User is admin, fetching requests...');
        const requestsData = await getTeamRequests(teamId);
        console.log('Requests data received:', requestsData);
        setRequests(requestsData);
      } else {
        console.log('User is not admin, not fetching requests');
        console.log('Team admin:', teamData.admin._id);
        console.log('Current user:', user?._id);
      }
    } catch (err) {
      console.log('Error fetching team data:', err);
      console.log('Error response:', err.response?.data);
      const message = err.response?.data?.message || 'Failed to load team data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [teamId, user]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleDebug = async () => {
    try {
      const response = await api.get(`/api/debug/team/${teamId}`);
      console.log('Debug info:', response.data);
      setDebugInfo(response.data);
    } catch (err) {
      console.log('Debug error:', err);
    }
  };

  const handleJoinTeam = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setJoinLoading(true);
    try {
      await createJoinRequest(teamId);
      if (team?.admin === user._id) {
        const requestsData = await getTeamRequests(teamId);
        setRequests(requestsData);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send join request';
      setError(message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      await updateRequestStatus(requestId, action);
      await fetchTeamData();
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${action} request`;
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const isTeamAdmin = team?.admin?._id === user?._id;
  const isMember = team?.members?.some(member => member._id === user?._id);

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="page-content">
          <div className="container">Loading team details...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Navbar />
        <main className="page-content">
          <div className="container">
            <div className="alert alert-error">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <div className="container">
          {/* Team Info Section */}
          <section className="card">
            <h2>{team?.name || 'Team Details'}</h2>
            
            {/* Debug Info */}
            <button onClick={handleDebug} className="btn btn-outline btn-small">
              Debug Info
            </button>
            
            {debugInfo && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
                <h4>Debug Info:</h4>
                <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="team-info">
              <p><strong>Sport:</strong> {team?.sport}</p>
              <p><strong>City:</strong> {team?.city}</p>
              <p><strong>Admin:</strong> {team?.admin?.name}</p>
              {team?.description && <p><strong>Description:</strong> {team.description}</p>}
              <p><strong>Members:</strong> {team?.members?.length || 0}</p>
            </div>

            {team?.members && team.members.length > 0 && (
              <div className="participants-section">
                <h3>Team Members</h3>
                <div className="participants-list">
                  {team.members.map((member) => (
                    <div key={member._id} className="participant-item">
                      {member.profileImage ? (
                        <img
                          src={getUploadUrl(member.profileImage)}
                          alt={member.name}
                          className="participant-avatar"
                        />
                      ) : (
                        <div className="participant-avatar-placeholder">
                          {member.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Join/Request Button */}
            {!isTeamAdmin && (
              <div className="team-actions">
                {isMember ? (
                  <button className="btn btn-secondary" disabled>
                    Joined
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleJoinTeam}
                    disabled={joinLoading}
                  >
                    {joinLoading ? 'Sending...' : 'Request to Join'}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Join Requests Section - Only for Team Admin */}
          {isTeamAdmin && (
            <section className="card">
              <h3>Join Requests</h3>
              
              {requests.length === 0 ? (
                <p className="muted">No pending join requests</p>
              ) : (
                <div className="requests-list">
                  {requests.map((request) => (
                    <div key={request._id} className="request-item">
                      <div className="request-info">
                        <div className="request-user-header">
                          {request.user.profileImage ? (
                            <img 
                              src={getUploadUrl(request.user.profileImage)} 
                              alt={request.user.name}
                              className="request-avatar"
                            />
                          ) : (
                            <div className="request-avatar-placeholder">
                              {request.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h4>{request.user.name}</h4>
                        </div>
                        <div className="request-details">
                          <p><strong>City:</strong> {request.user.city}</p>
                          <p><strong>Sport:</strong> {request.user.sport}</p>
                          <p><strong>Skill Level:</strong> {request.user.skillLevel}</p>
                        </div>
                      </div>
                      
                      <div className="request-actions">
                        <button
                          className="btn btn-success btn-small"
                          onClick={() => handleRequestAction(request._id, 'accepted')}
                          disabled={actionLoading === request._id}
                        >
                          {actionLoading === request._id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleRequestAction(request._id, 'rejected')}
                          disabled={actionLoading === request._id}
                        >
                          {actionLoading === request._id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeamDetailsPage;
