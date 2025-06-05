import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { exchangeSlackCode } from '../services/slackService';

export default function SlackOAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to get query params
  const getQueryParam = (param) => new URLSearchParams(location.search).get(param);

  useEffect(() => {
    async function handleOAuthCallback() {
      const code = getQueryParam('code');
      if (!code) {
        setError('Missing authorization code.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        // Exchange code for tokens & save
        await exchangeSlackCode(code);

        // Redirect back to Slack integration page or profile after success
        navigate('/profile/slack', { replace: true });
      } catch (err) {
        setError('Slack OAuth failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    handleOAuthCallback();
  }, [location.search, navigate]);

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Slack OAuth Callback</h2>
        {loading && <p>Processing Slack OAuth callback...</p>}
        {error && <div className="alert error">{error}</div>}
      </div>
    </div>
  );
}
