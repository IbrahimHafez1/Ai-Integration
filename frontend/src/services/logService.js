import api from './api';

export const getLeadLogs = async (token) => {
  const res = await api.get('/logs/leads', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const getCRMLogs = async (token) => {
  const res = await api.get('/logs/crm', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};
