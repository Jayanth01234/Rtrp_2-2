import api from './api';

export const createJoinRequest = async (teamId) => {
  const response = await api.post(`/api/requests/team/${teamId}`);
  return response.data;
};
