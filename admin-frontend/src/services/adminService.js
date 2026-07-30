import { api } from './api.js';

function toQueryString(params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

export const complaintService = {
  getAll: (params) => api.get(`/complaints${toQueryString(params)}`),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, status, remark) => api.patch(`/complaints/${id}/status`, { status, remark }),
  updatePriority: (id, priority) => api.patch(`/complaints/${id}/priority`, { priority }),
  assign: (id, payload) => api.patch(`/complaints/${id}/assign`, payload),
  addComment: (id, text, type) => api.post(`/complaints/${id}/comments`, { text, type }),
};

export const departmentService = {
  getAll: () => api.get('/departments'),
  create: (payload) => api.post('/departments', payload),
  update: (id, payload) => api.patch(`/departments/${id}`, payload),
  remove: (id) => api.delete(`/departments/${id}`),
};

export const userService = {
  getAll: (params) => api.get(`/users${toQueryString(params)}`),
  updateRole: (id, payload) => api.patch(`/users/${id}/role`, payload),
  setActive: (id, isActive) => api.patch(`/users/${id}/active`, { isActive }),
};

export const analyticsService = {
  getOverview: (params) => api.get(`/analytics/overview${toQueryString(params)}`),
};

export const notificationService = {
  getAll: (params) => api.get(`/notifications${toQueryString(params)}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const reportService = {
  // Returns a raw axios promise with responseType 'blob' so the caller
  // can turn it into a downloadable file — see AllComplaintsPage.
  downloadPdf: (params) => api.get(`/reports/pdf${toQueryString(params)}`, { responseType: 'blob' }),
};
