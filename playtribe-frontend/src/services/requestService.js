import api from './api';

export const createJoinRequest = async (teamId) => {
  console.log('Creating join request for team:', teamId);
  const response = await api.post(`/api/requests/team/${teamId}`);
  console.log('Create join request response:', response.data);
  return response.data;
};

export const getTeamRequests = async (teamId) => {
  console.log('Getting team requests for team:', teamId);
  const response = await api.get(`/api/requests/team/${teamId}`);
  console.log('Get team requests response:', response.data);
  return response.data;
};

export const updateRequestStatus = async (requestId, status) => {
  const response = await api.patch(`/api/requests/${requestId}`, { status });
  return response.data;
};

export const getMyRequests = async () => {
  const response = await api.get('/api/requests/me');
  return response.data;
};
