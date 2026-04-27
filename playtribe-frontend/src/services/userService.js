import api from './api';

export const getUserProfile = async () => {
  const response = await api.get('/api/users/profile');
  return response.data;
};

export const updateUserProfile = async (userData) => {
  const response = await api.put('/api/users/profile', userData);
  return response.data;
};

export const uploadProfileImage = async (formData) => {
  try {
    console.log('Sending FormData to server...');
    const response = await api.post('/api/users/upload-profile', formData);
    console.log('Server response:', response.data);
    return response.data;
  } catch (error) {
    console.log('Upload service error:', error);
    console.log('Error response:', error.response?.data);
    throw error;
  }
};
