import { api } from './api.js';

function toQueryString(params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

export const complaintService = {
  create: (formData) => api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  getMine: (params) => api.get(`/complaints/my${toQueryString(params)}`),

  getStats: () => api.get('/complaints/stats'),

  getCommunity: (params) => api.get(`/complaints/community${toQueryString(params)}`),

  getById: (id) => api.get(`/complaints/${id}`),

  update: (id, formData) => api.patch(`/complaints/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  remove: (id) => api.delete(`/complaints/${id}`),

  addComment: (id, text, parentId) => api.post(`/complaints/${id}/comments`, { text, type: 'public', parentId: parentId || undefined }),

  editComment: (id, commentId, text) => api.patch(`/complaints/${id}/comments/${commentId}`, { text }),

  deleteComment: (id, commentId) => api.delete(`/complaints/${id}/comments/${commentId}`),

  toggleUpvote: (id) => api.post(`/complaints/${id}/upvote`),
};

export const notificationService = {
  getAll: (params) => api.get(`/notifications${toQueryString(params)}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
