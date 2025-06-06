import React, { useEffect, useState } from 'react';

function isString(value) {
  return typeof value === 'string';
}

export default function SlackOAuthHandler() {
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!isString(code) || !code) {
      setStatus('error');
      setMessage('Invalid or missing OAuth code in URL');
      return;
    }

    async function saveToken() {
      try {
        const response = await fetch(`/slack/save-token?code=${encodeURIComponent(code)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to save Slack token');
        }

        setStatus('success');
        setMessage('Slack connected successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'An error occurred');
      }
    }

    saveToken();
  }, []);

  if (status === 'loading') {
    return <div>Connecting to Slack...</div>;
  }

  if (status === 'error') {
    return <div style={{ color: 'red' }}>Error: {message}</div>;
  }

  return <div style={{ color: 'green' }}>{message}</div>;
}
