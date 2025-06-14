import api from './api';

export const login = async (email, password) => {
  const res = await api.post('/user/login', { email, password });
  return res.data.data;
};

export const register = async (name, email, password) => {
  const res = await api.post('/user/register', { name, email, password });
  return res.data.data;
};

export const getProfile = async (token) => {
  const res = await api.get('/user/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};
