import axios from 'axios';
import { auth } from '../firebase/firebaseConfig.js';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const { message, code, errors } = error.response.data;
      const normalized = new Error(message || 'Something went wrong. Please try again.');
      normalized.code = code;
      normalized.fieldErrors = errors;
      normalized.status = error.response.status;
      return Promise.reject(normalized);
    }
    if (error.request) {
      const normalized = new Error('Could not reach the server. Check your connection and try again.');
      normalized.code = 'NETWORK_ERROR';
      return Promise.reject(normalized);
    }
    return Promise.reject(error);
  }
);
