import api from './api';

export const getTeamChat = async (teamId) => {
  const response = await api.get(`/api/chat/team/${teamId}`);
  return response.data;
};

export const getMatchChat = async (matchId) => {
  const response = await api.get(`/api/chat/match/${matchId}`);
  return response.data;
};

export const sendMessage = async (chatId, content) => {
  const response = await api.post(`/api/chat/${chatId}/message`, { content });
  return response.data;
};

export const getChatMessages = async (chatId, page = 1, limit = 50) => {
  const response = await api.get(`/api/chat/${chatId}/messages?page=${page}&limit=${limit}`);
  return response.data;
};

export const getUserChats = async () => {
  const response = await api.get('/api/chat/my-chats');
  return response.data;
};

export const updateChatParticipants = async (chatId, participants) => {
  const response = await api.patch(`/api/chat/${chatId}/participants`, { participants });
  return response.data;
};
