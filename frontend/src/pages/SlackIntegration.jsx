import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { redirectToSlack, checkSlackConnection } from '../services/slackService';
import './SlackIntegration.css';

export default function SlackIntegration() {
  const { user } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(null);
  const [error, setError] = useState('');

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

  const handleConnect = () => {
    redirectToSlack();
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Slack Integration</h2>
        {isConnected === null ? (
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
