import axios from 'axios';

export function redirectToSlackOAuth(userId) {
  const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
  const redirectUri = encodeURIComponent(import.meta.env.VITE_SLACK_REDIRECT_URI);
  const state = encodeURIComponent(userId);

  const slackOauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=channels:read,chat:write&redirect_uri=${redirectUri}&state=${state}`;

  window.location.href = slackOauthUrl;
}

export function redirectToGoogle(userId) {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google?userId=${userId}`;
}

export function redirectToZoho(userId) {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/zoho?userId=${userId}`;
}

export async function checkOAuthStatus(token) {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/check-tokens`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return res.data.data;
}
