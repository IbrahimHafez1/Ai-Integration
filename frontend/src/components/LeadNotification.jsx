import { useState, useEffect } from 'react';
import './LeadNotification.css';

export default function LeadNotification({ notification }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (notification) {
      setVisible(true);
    }
  }, [notification]);

  if (!notification || !visible) return null;

  return (
    <div className="lead-notification">
      <div className="notification-content">
        <div className="notification-text">
          <p className="notification-title">🎉 New Lead Notification</p>
          <p className="notification-message">
            A new lead is interested in <span className="interest">{notification.interest}</span>.
          </p>
        </div>
        <button className="close-button" onClick={() => setVisible(false)} aria-label="Close">
          &times;
        </button>
      </div>
    </div>
  );
}
