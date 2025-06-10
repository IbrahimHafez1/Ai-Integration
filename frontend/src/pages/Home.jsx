import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="hero-outer-center">
      <div className="hero-container">
        <div className="hero-card hero-card-center">
          <h1 className="hero-title">Welcome to Dragify</h1>
          <p className="hero-subtitle">
            Dragify lets you seamlessly integrate Slack leads into Zoho CRM, get email
            notifications.
          </p>

          <div className="hero-buttons">
            {user ? (
              <>
                <Link to="/profile" className="btn-primary">
                  View Profile
                </Link>
                <Link to="/logs/leads" className="btn-secondary">
                  View Lead Logs
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn-secondary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
