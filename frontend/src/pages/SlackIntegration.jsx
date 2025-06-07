import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { redirectToSlackOAuth } from '../../utils/slackOAuth';
import { checkSlackConnection } from '../services/slackService';
import './SlackIntegration.css';

export default function SlackIntegration() {
  const { token } = useContext(AuthContext);
  const [connected, setConnected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkConnection() {
      try {
        const resp = await checkSlackConnection(token);
        setConnected(resp.data.connected);
      } catch (err) {
        setError('Failed to fetch connection status');
      } finally {
        setLoading(false);
      }
    }
    if (token) checkConnection();
  }, [token]);

  const handleConnectSlack = () => {
    if (!token) {
      alert('You must be logged in to connect Slack');
      return;
    }
    redirectToSlackOAuth(token);
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Slack Integration</h2>
        {loading ? (
          <div className="alert">Checking connection...</div>
        ) : error ? (
          <div className="alert error">{error}</div>
        ) : connected ? (
          <div className="alert success">Slack is connected!</div>
        ) : (
          <div className="alert">Slack is not connected.</div>
        )}
        <button onClick={handleConnectSlack} className="connect-btn">
          {connected ? 'Reconnect Slack' : 'Connect Slack'}
        </button>
      </div>
    </div>
  );
}
