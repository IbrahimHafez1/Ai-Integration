import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import './OAuth.css';
import { redirectToGoogle, redirectToZoho, redirectToSlack } from '../services/oAuthService';

export default function IntegrationsPage() {
  const { token } = useContext(AuthContext);
  const [status, setStatus] = useState({ slack: null, google: null, zoho: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkConnections() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [slackRes, googleRes, zohoRes] = await Promise.all([
          axios.get('/api/slack/connection', { headers }),
          axios.get('/api/user/oauth-status/google', { headers }),
          axios.get('/api/user/oauth-status/zoho', { headers }),
        ]);
        setStatus({
          slack: slackRes.data.connected,
          google: googleRes.data.connected,
          zoho: zohoRes.data.connected,
        });
      } catch (err) {
        setError('Failed to fetch integration status');
      } finally {
        setLoading(false);
      }
    }
    if (token) checkConnections();
  }, [token]);

  const handleConnect = (provider) => {
    if (!token) {
      alert('You must be logged in to connect');
      return;
    }

    switch (provider) {
      case 'slack':
        redirectToSlack(token);
        break;
      case 'google':
        redirectToGoogle();
        break;
      case 'zoho':
        redirectToZoho();
        break;
      default:
        console.warn('Unknown provider:', provider);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Third-Party Integrations</h2>
        {loading ? (
          <div className="alert">Checking connections...</div>
        ) : error ? (
          <div className="alert error">{error}</div>
        ) : (
          <>
            <div className="integration-item">
              <span>Slack</span>
              <span>{status.slack ? '✅ Connected' : '❌ Not connected'}</span>
              <button onClick={() => handleConnect('slack')} className="connect-btn">
                {status.slack ? 'Reconnect Slack' : 'Connect Slack'}
              </button>
            </div>
            <div className="integration-item">
              <span>Google</span>
              <span>{status.google ? '✅ Connected' : '❌ Not connected'}</span>
              <button onClick={() => handleConnect('google')} className="connect-btn">
                {status.google ? 'Reconnect Google' : 'Connect Google'}
              </button>
            </div>
            <div className="integration-item">
              <span>Zoho</span>
              <span>{status.zoho ? '✅ Connected' : '❌ Not connected'}</span>
              <button onClick={() => handleConnect('zoho')} className="connect-btn">
                {status.zoho ? 'Reconnect Zoho' : 'Connect Zoho'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
