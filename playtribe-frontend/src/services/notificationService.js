import api from './api';

export const getNotifications = async () => {
  const response = await api.get('/api/notifications');
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/api/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/api/notifications/${id}/read`);
  return response.data;
};
