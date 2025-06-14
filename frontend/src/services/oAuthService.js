import axios from 'axios';

export function redirectToSlackOAuth(userId) {
  const userIdString = String(userId);
  const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
  const redirectUri = encodeURIComponent(import.meta.env.VITE_SLACK_REDIRECT_URI);
  const state = encodeURIComponent(userIdString);

  const slackOauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=channels:read,chat:write&redirect_uri=${redirectUri}&state=${state}`;

  window.location.href = slackOauthUrl;
}

export function redirectToGoogle(userId) {
  const userIdString = String(userId);
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google?userId=${userIdString}`;
}

export function redirectToZoho(userId) {
  const userIdString = String(userId);
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/zoho?userId=${userIdString}`;
}

export async function checkOAuthStatus(token) {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/check-tokens`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return res.data.data;
}
