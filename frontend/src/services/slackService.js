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

export async function exchangeSlackCode(code) {
  const response = await axios.get('/api/slack/callback', {
    params: { code },
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Slack OAuth exchange failed');
  }
  return response.data.message;
}
