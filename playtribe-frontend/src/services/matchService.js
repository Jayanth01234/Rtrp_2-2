import api from './api';

export const getMatches = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  );
  const response = await api.get('/api/matches', { params });
  return response.data;
};

export const createMatch = async (matchData) => {
  const response = await api.post('/api/matches', matchData);
  return response.data;
};

export const joinMatch = async (matchId) => {
  const response = await api.post(`/api/matches/${matchId}/join`);
  return response.data;
};

export const getMatch = async (matchId) => {
  const response = await api.get(`/api/matches/${matchId}`);
  return response.data;
};

