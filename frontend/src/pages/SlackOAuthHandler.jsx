import { useEffect, useState } from 'react';
import apiClient from '../services/api';

function isString(value) {
  return typeof value === 'string';
}

export default function SlackOAuthHandler() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!isString(code) || !code || !isString(state) || !state) {
      setStatus('error');
      setMessage('Invalid or missing OAuth code or user token in URL');
      return;
    }

    async function saveToken() {
      try {
        const response = await apiClient.get('/api/slack/save-token', {
          params: { code, userToken: state },
        });

        setStatus('success');
        setMessage(response?.data?.message || 'Slack connected successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err?.response?.data?.message || err.message || 'An error occurred');
      }
    }

    saveToken();
  }, []);

  if (status === 'loading') return <div>Connecting to Slack...</div>;
  if (status === 'error') return <div style={{ color: 'red' }}>Error: {message}</div>;

  return <div style={{ color: 'green' }}>{message}</div>;
}
