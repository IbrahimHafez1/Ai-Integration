import axios from 'axios';

export const login = async (email, password) => {
  const res = await axios.post('/api/user/login', { email, password });
  return res.data.data;
};

export const register = async (name, email, password) => {
  const res = await axios.post('/api/user/register', { name, email, password });
  return res.data.data;
};

export const getProfile = async (token) => {
  const res = await axios.get('/api/user/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};
