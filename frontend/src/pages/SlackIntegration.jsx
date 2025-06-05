import React, { useEffect, useContext, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { redirectToSlack, checkSlackConnection } from '../services/slackService';
import apiClient from '../services/api';
import './SlackIntegration.css';

export default function SlackIntegration() {
  const { user } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStatus() {
      try {
        const resp = await checkSlackConnection();
        setIsConnected(resp.connected);
      } catch (err) {
        setIsConnected(false);
        setError('Failed to check Slack connection');
      }
    }

    fetchStatus();
  }, []);

  useEffect(() => {
    async function handleSlackOAuthCallback() {
      const code = searchParams.get('code');
      if (!code) return;

      setLoading(true);
      try {
        await apiClient.get(`/slack/callback?code=${code}`);
        setIsConnected(true);
        setError('');
        searchParams.delete('code');
        setSearchParams(searchParams);
      } catch (err) {
        setError('Failed to connect Slack');
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    }

    handleSlackOAuthCallback();
  }, [searchParams, setSearchParams]);

  const handleConnect = () => {
    redirectToSlack();
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Slack Integration</h2>
        {loading ? (
          <p>Processing Slack connection...</p>
        ) : isConnected === null ? (
          <p>Checking Slack connection...</p>
        ) : isConnected ? (
          <div className="alert success">
            ✅ Slack is already connected for user <strong>{user.email}</strong>
          </div>
        ) : (
          <>
            <p>🔗 Slack is not connected yet.</p>
            <button onClick={handleConnect}>Connect Slack</button>
            {error && <div className="alert error">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
