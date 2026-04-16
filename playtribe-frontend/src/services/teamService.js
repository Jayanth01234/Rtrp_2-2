import api from './api';

export const getTeams = async (city) => {
  const params = city ? { city } : {};
  const response = await api.get('/api/teams', { params });
  return response.data;
};

export const createTeam = async (teamData) => {
  const response = await api.post('/api/teams', teamData);
  return response.data;
};

