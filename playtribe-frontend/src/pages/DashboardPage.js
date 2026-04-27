import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getTeams } from '../services/teamService';
import { getMatches } from '../services/matchService';
import { getTeamRequests } from '../services/requestService';
import { getMatchRequests } from '../services/matchRequestService';

const DashboardPage = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState('');
  const [myTeams, setMyTeams] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [pendingTeamRequests, setPendingTeamRequests] = useState([]);
  const [pendingMatchRequests, setPendingMatchRequests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let profile = user;
        if (!profile) {
          const response = await api.get('/api/users/profile');
          profile = response.data.user || response.data;
          setUser(profile);
        }

        const [teams, matches] = await Promise.all([getTeams(), getMatches()]);
        const ownedTeams = teams.filter((team) => team.admin?._id === profile?._id);
        const ownedMatches = matches.filter((match) => match.creator?._id === profile?._id);

        setMyTeams(ownedTeams);
        setMyMatches(ownedMatches);

        const teamRequestsResponses = await Promise.all(
          ownedTeams.map(async (team) => {
            try {
              return await getTeamRequests(team._id);
            } catch (requestErr) {
              return [];
            }
          })
        );

        const matchRequestsResponses = await Promise.all(
          ownedMatches.map(async (match) => {
            try {
              return await getMatchRequests(match._id);
            } catch (requestErr) {
              return [];
            }
          })
        );

        const allPendingTeamRequests = teamRequestsResponses
          .flat()
          .filter((request) => String(request.status || '').toLowerCase() === 'pending');
        const allPendingMatchRequests = matchRequestsResponses
          .flat()
          .filter((request) => String(request.status || '').toLowerCase() === 'pending');

        setPendingTeamRequests(allPendingTeamRequests);
        setPendingMatchRequests(allPendingMatchRequests);
      } catch (err) {
        const message =
          err.response?.data?.message || 'Failed to load dashboard. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
          <h2>Dashboard</h2>
          {loading && <p>Loading dashboard...</p>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && !error && (
            <>
              <div className="profile-meta">
                <div>
                  <span className="label">My Teams</span>
                  <span>{myTeams.length}</span>
                </div>
                <div>
                  <span className="label">My Matches</span>
                  <span>{myMatches.length}</span>
                </div>
                <div>
                  <span className="label">Pending Requests</span>
                  <span>{pendingTeamRequests.length + pendingMatchRequests.length}</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>My Teams</h3>
                {myTeams.length === 0 ? (
                  <p className="muted">You have not created any teams yet.</p>
                ) : (
                  <div className="list">
                    {myTeams.map((team) => (
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
                        </div>
                        <span className="tag">Members: {team.members?.length || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>My Matches</h3>
                {myMatches.length === 0 ? (
                  <p className="muted">You have not created any matches yet.</p>
                ) : (
                  <div className="list">
                    {myMatches.map((match) => (
                      <div key={match._id} className="list-item">
                        <div>
                          <h3>
                            <Link to={`/match/${match._id}`} className="team-link">
                              {match.sport}
                            </Link>
                          </h3>
                          <p className="muted">
                            {match.city} • {new Date(match.date).toLocaleDateString()} at {match.time}
                          </p>
                        </div>
                        <span className="tag">
                          Players: {match.participants?.length || 0}/{match.maxPlayers}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>Pending Requests</h3>
                {pendingTeamRequests.length === 0 && pendingMatchRequests.length === 0 ? (
                  <p className="muted">No pending requests.</p>
                ) : (
                  <div className="list">
                    {pendingTeamRequests.map((request) => (
                      <div key={request._id} className="list-item">
                        <div>
                          <h3>Team Request</h3>
                          <p className="muted">
                            {request.user?.name} requested to join team
                          </p>
                        </div>
                        <Link to={`/team/${request.team}`} className="btn btn-outline btn-small">
                          Review
                        </Link>
                      </div>
                    ))}
                    {pendingMatchRequests.map((request) => (
                      <div key={request._id} className="list-item">
                        <div>
                          <h3>Match Request</h3>
                          <p className="muted">
                            {request.user?.name} requested to join your match
                          </p>
                        </div>
                        <Link
                          to={`/match/${request.match?._id || request.match}`}
                          className="btn btn-outline btn-small"
                        >
                          Review
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="card-actions">
            <Link to="/teams" className="btn btn-primary">
              Explore Teams
            </Link>
            <Link to="/matches" className="btn btn-outline">
              Explore Matches
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;

