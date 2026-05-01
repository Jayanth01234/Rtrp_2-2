import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMatchRequests, updateMatchRequest } from '../services/matchRequestService';
import { getMatch } from '../services/matchService';
import { useAuth } from '../context/AuthContext';

const MatchDetailsPage = () => {
  const { user } = useAuth();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getMatchSchedule = (matchData) => {
    const dateString = new Date(matchData.date).toISOString().split('T')[0];
    const start = matchData.startTime || matchData.time || '';
    const end = matchData.endTime || matchData.time || '';
    const startDateTime = start ? new Date(`${dateString}T${start}:00`) : null;
    const endDateTime = end ? new Date(`${dateString}T${end}:00`) : null;

    return { start, end, startDateTime, endDateTime };
  };

  const getMatchStatus = (matchData) => {
    const { startDateTime, endDateTime } = getMatchSchedule(matchData);
    const now = new Date();

    if (startDateTime && !Number.isNaN(startDateTime.getTime())) {
      if (endDateTime && !Number.isNaN(endDateTime.getTime()) && now > endDateTime) {
        return { label: 'Ended', className: 'tag tag-ended' };
      }
      if (endDateTime && !Number.isNaN(endDateTime.getTime()) && now >= startDateTime && now <= endDateTime) {
        return { label: 'Running', className: 'tag tag-running' };
      }
    }

    return { label: 'Upcoming', className: 'tag tag-upcoming' };
  };

  useEffect(() => {
    fetchMatchData();
    if (user) {
      fetchRequests();
    }
  }, [matchId, user]);

  const fetchMatchData = async () => {
    try {
      const data = await getMatch(matchId);
      setMatch(data);
    } catch (err) {
      setError('Failed to load match details');
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await getMatchRequests(matchId);
      setRequests(data);
    } catch (err) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await updateMatchRequest(requestId, action);
      await fetchMatchData();
      await fetchRequests();
    } catch (err) {
      alert(`Failed to ${action} request`);
    }
  };

  const isCreator = match && match.creator._id === user?._id;
  const schedule = match ? getMatchSchedule(match) : null;
  const status = match ? getMatchStatus(match) : null;

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container alert alert-error">{error}</div>;
  if (!match) return <div className="container">Match not found</div>;

  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <section className="card">
          <div className="team-info">
            <h2>{match.sport} Match</h2>
            {status && <p><strong>Status:</strong> <span className={status.className}>{status.label}</span></p>}
            <p><strong>Date:</strong> {new Date(match.date).toLocaleDateString()}</p>
            <p><strong>Start Time:</strong> {schedule?.start}</p>
            <p><strong>End Time:</strong> {schedule?.end}</p>
            <p><strong>Location:</strong> {match.location}</p>
            <p><strong>City:</strong> {match.city}</p>
            <p><strong>Max Players:</strong> {match.maxPlayers}</p>
            <p><strong>Current Players:</strong> {match.participants?.length || 0}</p>
            
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

          {match.participants && match.participants.length > 0 && (
            <div className="participants-section">
              <h3>Current Participants</h3>
              <div className="participants-list">
                {match.participants.map(participant => (
                  <div key={participant._id} className="participant-item">
                    {participant.profileImage ? (
                      <img 
                        src={`http://localhost:5000/uploads/${participant.profileImage}`} 
                        alt={participant.name}
                        className="participant-avatar"
                      />
                    ) : (
                      <div className="participant-avatar-placeholder">
                        {participant.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                    )}
                    <span>{participant.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {isCreator && (
          <section className="card">
            <h2>Join Requests</h2>
            {requests.length === 0 ? (
              <p>No pending requests</p>
            ) : (
              <div className="requests-list">
                {requests.map(request => (
                  <div key={request._id} className="request-item">
                    <div className="request-user-info">
                      {request.user.profileImage ? (
                        <img 
                          src={`http://localhost:5000/uploads/${request.user.profileImage}`} 
                          alt={request.user.name}
                          className="request-avatar"
                        />
                      ) : (
                        <div className="request-avatar-placeholder">
                          {request.user.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <div className="request-details">
                        <h4>{request.user.name}</h4>
                        <p className="muted">
                          {request.user.city} - {request.user.sport} ({request.user.skillLevel})
                        </p>
                        <p className="muted">
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="request-actions">
                      {request.status === 'pending' ? (
                        <>
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() => handleRequestAction(request._id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-small btn-outline"
                            onClick={() => handleRequestAction(request._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`tag ${request.status === 'accepted' ? 'tag-success' : 'tag-error'}`}>
                          {request.status === 'accepted' ? 'Accepted' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default MatchDetailsPage;
