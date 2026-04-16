import api from './api';

export const getMatches = async (city) => {
  const params = city ? { city } : {};
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

