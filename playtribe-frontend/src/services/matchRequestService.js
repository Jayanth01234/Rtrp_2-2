import api from './api';

export const createMatchJoinRequest = async (matchId) => {
  console.log('Creating match join request for match:', matchId);
  const response = await api.post('/api/match-requests', { matchId });
  console.log('Match join request service response:', response.data);
  return response.data;
};

export const getMatchRequests = async (matchId) => {
  const response = await api.get(`/api/match-requests/match/${matchId}`);
  return response.data;
};

export const updateMatchRequest = async (requestId, status) => {
  const response = await api.put(`/api/match-requests/${requestId}`, { status });
  return response.data;
};

export const getMyMatchRequests = async () => {
  const response = await api.get('/api/match-requests/my');
  return response.data;
};
