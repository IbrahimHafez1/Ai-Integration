import apiClient from '../utils/apiClient';

export const login = async (payload) => {
  const response = (await apiClient.post) < LoginResponse > ('/auth/login', payload);
  const { token } = response.data.data;

  localStorage.setItem('jwtToken', token);
  return response.data;
};
