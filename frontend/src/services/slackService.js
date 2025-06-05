import apiClient from './api';

export function redirectToSlack() {
  // Hitting this URL will redirect the browser to Slack’s OAuth consent screen
  window.location.href = `${import.meta.env.VITE_API_URL}/api/slack`;
}

// Optionally, if you have an endpoint to check Slack connection status:
export async function checkSlackConnection() {
  const resp = await apiClient.get('/slack/check');
  return resp.data;
}
