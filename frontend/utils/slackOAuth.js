export function redirectToSlackOAuth(userToken) {
  const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
  const redirectUri = encodeURIComponent(import.meta.env.VITE_SLACK_REDIRECT_URI);
  const state = encodeURIComponent(userToken);

  const slackOauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=channels:read,chat:write&redirect_uri=${redirectUri}&state=${state}`;

  window.location.href = slackOauthUrl;
}
