import axios from 'axios';

export function redirectToSlack() {
  // Hitting this URL will redirect the browser to Slack’s OAuth consent screen
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/slack`;
}

// Optionally, if you have an endpoint to check Slack connection status:
export async function checkSlackConnection(token) {
  const resp = await axios.get('/api/slack/check', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return resp.data;
}
