import { useState, useEffect } from 'react';
import './LeadNotification.css';

export default function LeadNotification({ notification }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (notification) {
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!notification || !visible) return null;

  return (
    <div className="lead-notification">
      <div className="notification-content">
        <div className="notification-text">
          <p className="notification-title">🎉 New Lead Notification</p>
          <p className="notification-message">
            <strong>Lead Text:</strong> <span className="lead-text">{notification.text}</span>
          </p>
          {notification.status && (
            <p className="notification-status">
              <strong>Status:</strong> <span className="status-badge">{notification.status}</span>
            </p>
          )}
          {notification.leadId && (
            <p className="notification-id">
              <strong>Lead ID:</strong> <span className="lead-id">{notification.leadId}</span>
            </p>
          )}
        </div>
        <button className="close-button" onClick={() => setVisible(false)} aria-label="Close">
          &times;
        </button>
      </div>
    </div>
  );
}
