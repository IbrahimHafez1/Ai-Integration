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

    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

    setModal({
      visible: true,
      title: `${providerName} Integration`,
      message: `Redirecting to ${providerName} for connection...`,
    });

    // Ensure user._id is converted to string to avoid [object Object] issue
    const userIdString = String(user._id);

    switch (provider) {
      case 'slack':
        redirectToSlackOAuth(userIdString);
        break;
      case 'google':
        redirectToGoogle(userIdString);
        break;
      case 'zoho':
        redirectToZoho(userIdString);
        break;
      default:
        setModal({ visible: false, title: '', message: '' });
    }
  };

  const closeModal = () => {
    setModal({ visible: false, title: '', message: '' });
  };

  return (
    <div className="integration-container">
      {loading ? (
        <div className="status-alert status-neutral">Checking connections...</div>
      ) : error ? (
        <div className="status-alert status-error">{error}</div>
      ) : (
        <>
          {['slack', 'google', 'zoho'].map((provider) => (
            <div key={provider} className="integration-card">
              <h2>{provider.charAt(0).toUpperCase() + provider.slice(1)}</h2>
              <div
                className={`status-alert ${status[provider] ? 'status-success' : 'status-neutral'}`}
              >
                {status[provider] ? '✅ Connected' : '❌ Not connected'}
              </div>
              <button onClick={() => handleConnect(provider)} className="connect-btn">
                {status[provider] ? `Reconnect ${provider}` : `Connect ${provider}`}
              </button>
            </div>
          ))}
        </>
      )}
      {modal.visible && <Modal title={modal.title} message={modal.message} onClose={closeModal} />}
    </div>
  );
}
