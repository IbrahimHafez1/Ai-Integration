import axios from 'axios';

const BASE_URL = '/api/trigger';

export const getTriggerConfigs = async (token) => {
  const res = await axios.get(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createTriggerConfig = async (data, token) => {
  const res = await axios.post(BASE_URL, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateTriggerConfig = async (id, data, token) => {
  const res = await axios.patch(`${BASE_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteTriggerConfig = async (id, token) => {
  const res = await axios.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
