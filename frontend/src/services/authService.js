// services/authService.js
import axios from 'axios';

export const login = async (email, password) => {
  const res = await axios.post('/api/user/login', { email, password });
  return res.data.data; // { token }
};

export const register = async (name, email, password) => {
  const res = await axios.post('/api/auth/register', { name, email, password });
  return res.data.data; // { token }
};

export const getProfile = async (token) => {
  const res = await axios.get('/api/user/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};
