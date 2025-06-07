import axios from 'axios';

export async function getLeadLogs(token) {
  const resp = await axios.get('/api/logs/leads', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data.data;
}

export async function getCRMLogs(token) {
  const resp = await axios.get('/api/logs/crm', { headers: { Authorization: `Bearer ${token}` } });
  return resp.data.data;
}
