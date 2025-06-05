import apiClient from './api';

// Fetch lead logs
export async function getLeadLogs() {
  const resp = await apiClient.get('/logs/leads');
  return resp.data.data;
}

// Fetch CRM logs
export async function getCRMLogs() {
  const resp = await apiClient.get('/logs/crm');
  return resp.data.data;
}
