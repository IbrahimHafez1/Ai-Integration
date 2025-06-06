import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { redirectToSlackOAuth } from '../../utils/slackOAuth';
import './SlackIntegration.css';

export default function SlackIntegration() {
  const { token } = useContext(AuthContext);

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
        <button onClick={handleConnectSlack}>Connect Slack</button>
      </div>
    </div>
  );
}
