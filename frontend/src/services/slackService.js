import axios from 'axios';

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
