import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import './OAuth.css';
import { redirectToGoogle, redirectToZoho, redirectToSlackOAuth } from '../services/oAuthService';
import { checkOAuthStatus } from '../services/oAuthService';

export default function IntegrationsPage() {
  const { user, token } = useContext(AuthContext);
  const [status, setStatus] = useState({ slack: null, google: null, zoho: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    async function fetchOAuthStatus() {
      try {
        const connectionStatus = await checkOAuthStatus(token);
        setStatus(connectionStatus);
      } catch (err) {
        console.error('Error fetching OAuth status:', err);
        setError('Failed to fetch integration status');
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchOAuthStatus();
  }, [token]);

  const handleConnect = (provider) => {
    if (!token) {
      alert('You must be logged in to connect');
      return;
    }

    // Show modal confirmation
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

    setModal({
      visible: true,
      title: `${providerName} Integration`,
      message: `Redirecting to ${providerName} for connection...`,
    });

    switch (provider) {
      case 'slack':
        redirectToSlackOAuth(user._id);
        break;
      case 'google':
        redirectToGoogle(user._id);
        break;
      case 'zoho':
        redirectToZoho(user._id);
        break;
      default:
        console.warn('Unknown provider:', provider);
        setModal({ visible: false, title: '', message: '' });
    }
  };

  const closeModal = () => {
    setModal({ visible: false, title: '', message: '' });
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

      {modal.visible && <Modal title={modal.title} message={modal.message} onClose={closeModal} />}
    </div>
  );
}
