import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateUserProfile, uploadProfileImage } from '../services/userService';
import { getTeams } from '../services/teamService';
import { getMatches } from '../services/matchService';
import { getMyRequests } from '../services/requestService';
import { getMyMatchRequests } from '../services/matchRequestService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getUploadUrl } from '../services/api';

const ProfilePage = () => {
  const { user, updateUserProfile: updateGlobalUser } = useAuth();
  const [loading, setLoading] = useState(!user);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    sport: '',
    skillLevel: ''
  });
  const [toast, setToast] = useState({ text: '', type: '' });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activity, setActivity] = useState({
    myTeams: [],
    joinedMatches: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        city: user.city,
        sport: user.sport,
        skillLevel: user.skillLevel
      });
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) {
        return;
      }

      setActivityLoading(true);
      try {
        const [teams, matches, teamRequests, matchRequests] = await Promise.all([
          getTeams(),
          getMatches(),
          getMyRequests(),
          getMyMatchRequests()
        ]);

        const myTeams = teams.filter(
          (team) =>
            team.admin?._id === user._id ||
            (team.members || []).some((member) => (member._id || member) === user._id)
        );

        const joinedMatches = matches.filter(
          (match) =>
            match.creator?._id === user._id ||
            (match.participants || []).some((participant) => (participant._id || participant) === user._id)
        ).length;

        const pendingTeamRequests = teamRequests.filter(
          (request) => String(request.status || '').toLowerCase() === 'pending'
        ).length;
        const pendingMatchRequests = matchRequests.filter(
          (request) => String(request.status || '').toLowerCase() === 'pending'
        ).length;

        setActivity({
          myTeams: myTeams.slice(0, 3),
          joinedMatches,
          pendingRequests: pendingTeamRequests + pendingMatchRequests
        });
      } catch (error) {
        console.log('Error loading profile activity:', error);
        setActivity({
          myTeams: [],
          joinedMatches: 0,
          pendingRequests: 0
        });
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  const showMessage = (text, type) => {
    setToast({ text, type });
    setTimeout(() => {
      setToast({ text: '', type: '' });
    }, 3000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updatedUser = await updateUserProfile(formData);
      updateGlobalUser(updatedUser);
      setEditing(false);
      showMessage('Profile updated successfully!', 'success');
    } catch (error) {
      showMessage('Error updating profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      city: user.city,
      sport: user.sport,
      skillLevel: user.skillLevel
    });
    setEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      console.log('No file selected');
      showMessage('Please select an image file', 'error');
      return;
    }

    console.log('Starting upload for file:', selectedFile.name);
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    try {
      const response = await uploadProfileImage(formData);
      console.log('Upload response:', response);
      
      // Update global user state with new image
      updateGlobalUser({
        ...user,
        profileImage: response.profileImage
      });
      
      setSelectedFile(null);
      showMessage('Profile image uploaded successfully!', 'success');
    } catch (err) {
      console.log('Upload error:', err);
      console.log('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload profile image';
      showMessage(errorMessage, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <div className="container">User not found</div>;
  }

  const profileInitial = user.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="page">
      <Navbar />
      <main className="page-content profile-dashboard">
        {toast.text && <div className={`profile-toast profile-toast-${toast.type}`}>{toast.text}</div>}

        <div className="profile-dashboard-grid">
          <section className="card profile-panel profile-panel-left">
            <div className="profile-photo-wrap">
              <div className="profile-avatar profile-avatar-large">
                {user.profileImage ? (
                  <img
                    src={getUploadUrl(user.profileImage)}
                    alt={`${user.name}'s profile`}
                    className="profile-img"
                  />
                ) : (
                  <div className="profile-placeholder">{profileInitial}</div>
                )}
                <div className="profile-photo-overlay">Change Photo</div>
              </div>
            </div>

            <h2 className="profile-user-name">
              <span className="profile-icon" aria-hidden="true">👤</span> {user.name}
            </h2>
            <p className="profile-user-email">
              <span className="profile-icon" aria-hidden="true">✉️</span> {user.email}
            </p>

            <div className="profile-details-grid">
              <div className="profile-row">
                <span className="profile-label">City</span>
                <span className="profile-value"><span className="profile-icon" aria-hidden="true">📍</span> {user.city || 'Not set'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Sport</span>
                <span className="profile-value"><span className="profile-icon" aria-hidden="true">🏅</span> {user.sport || 'Not set'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Skill</span>
                <span className="profile-value"><span className="profile-icon" aria-hidden="true">⭐</span> {user.skillLevel || 'Not set'}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary profile-glow-btn" onClick={() => setEditing((prev) => !prev)}>
                {editing ? 'Close Editor' : 'Edit Profile'}
              </button>
            </div>
          </section>

          <section className="card profile-panel profile-panel-center">
            <h3 className="profile-section-title"><span className="profile-icon" aria-hidden="true">📊</span> User Activity</h3>
            <div className="profile-activity-grid">
              <div className="profile-activity-card">
                <p className="profile-activity-title"><span className="profile-icon" aria-hidden="true">👥</span> My Teams</p>
                <p className="profile-activity-count">
                  {activityLoading ? '...' : activity.myTeams.length}
                </p>
                <div className="profile-mini-list">
                  {activity.myTeams.length > 0 ? (
                    activity.myTeams.map((team) => (
                      <span key={team._id} className="profile-mini-item">
                        {team.name}
                      </span>
                    ))
                  ) : (
                    <span className="profile-mini-item muted">No teams yet</span>
                  )}
                </div>
              </div>

              <div className="profile-activity-card">
                <p className="profile-activity-title"><span className="profile-icon" aria-hidden="true">🏟️</span> Matches Joined</p>
                <p className="profile-activity-count">
                  {activityLoading ? '...' : activity.joinedMatches}
                </p>
              </div>

              <div className="profile-activity-card">
                <p className="profile-activity-title"><span className="profile-icon" aria-hidden="true">⏳</span> Pending Requests</p>
                <p className="profile-activity-count">
                  {activityLoading ? '...' : activity.pendingRequests}
                </p>
              </div>
            </div>
          </section>

          <section className="card profile-panel profile-panel-right">
            <h3 className="profile-section-title"><span className="profile-icon" aria-hidden="true">⚡</span> Actions</h3>

            <div className="profile-upload-card">
              <h4><span className="profile-icon" aria-hidden="true">🖼️</span> Upload Profile Image</h4>
              <div className="form-group">
                <label htmlFor="profileImage">Select Image</label>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-control"
                />
                {selectedFile && <p className="file-info">Selected: {selectedFile.name}</p>}
              </div>
              <button
                type="button"
                className="btn btn-primary profile-glow-btn"
                onClick={handleImageUpload}
                disabled={uploadLoading || !selectedFile}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>

            {editing && (
              <form onSubmit={handleSubmit} className="profile-edit-form">
                <h4><span className="profile-icon" aria-hidden="true">✏️</span> Edit Details</h4>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sport">Sport</label>
                  <input
                    type="text"
                    id="sport"
                    name="sport"
                    value={formData.sport}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="skillLevel">Skill Level</label>
                  <select
                    id="skillLevel"
                    name="skillLevel"
                    value={formData.skillLevel}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Skill Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary profile-glow-btn" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="profile-quick-actions">
              <h4><span className="profile-icon" aria-hidden="true">🚀</span> Quick Actions</h4>
              <div className="profile-action-links">
                <Link to="/teams" className="btn btn-outline">
                  Create Team
                </Link>
                <Link to="/matches" className="btn btn-outline">
                  Create Match
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
