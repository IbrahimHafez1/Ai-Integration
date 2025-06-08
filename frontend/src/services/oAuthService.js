import axios from 'axios';

export async function redirectToSlack(token) {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/auth/slack`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (data?.redirectUrl) {
      window.location.href = data.redirectUrl;
    } else {
      throw new Error('Missing redirect URL');
    }
  } catch (err) {
    console.error('Failed to fetch Slack redirect URL:', err);
    alert('Error connecting to Slack');
  }
}

export function redirectToGoogle() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
}

export function redirectToZoho() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/zoho`;
}
