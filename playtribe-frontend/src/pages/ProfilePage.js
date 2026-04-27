import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, uploadProfileImage } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUserProfile: updateGlobalUser } = useAuth();
  const [loading, setLoading] = useState(!user);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    sport: '',
    skillLevel: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

  
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
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
    try {
      const updatedUser = await updateUserProfile(formData);
      updateGlobalUser(updatedUser);
      setEditing(false);
      showMessage('Profile updated successfully!', 'success');
    } catch (error) {
      showMessage('Error updating profile', 'error');
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

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2>Profile</h2>
        </div>
        <div className="card-body">
          {message && (
            <div className={`alert alert-${messageType}`}>
              {message}
            </div>
          )}

          {!editing ? (
            <div>
              <div className="profile-info">
                <div className="profile-image-section">
                  <div className="profile-image">
                    {user.profileImage ? (
                      <img 
                        src={`http://localhost:5000/uploads/${user.profileImage}`} 
                        alt={`${user.name}'s profile`}
                        className="profile-img"
                      />
                    ) : (
                      <div className="profile-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="profile-details">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>City:</strong> {user.city}</p>
                  <p><strong>Sport:</strong> {user.sport}</p>
                  <p><strong>Skill Level:</strong> {user.skillLevel}</p>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Image Upload Section */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-header">
              <h3>Upload Profile Image</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="profileImage">Select Image</label>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-control"
                />
                {selectedFile && (
                  <p className="file-info">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImageUpload}
                disabled={uploadLoading || !selectedFile}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
