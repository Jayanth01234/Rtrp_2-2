import api from './api';

export const getTeams = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  );
  const response = await api.get('/api/teams', { params });
  return response.data;
};

export const createTeam = async (teamData) => {
  const response = await api.post('/api/teams', teamData);
  return response.data;
};

export const getTeam = async (teamId) => {
  const response = await api.get(`/api/teams/${teamId}`);
  return response.data;
};

