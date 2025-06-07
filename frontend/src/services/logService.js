import apiClient from './api';

export async function getLeadLogs() {
  const resp = await apiClient.get('/logs/leads');
  return resp.data.data;
}

export async function getCRMLogs() {
  const resp = await apiClient.get('/logs/crm');
  return resp.data.data;
}
