import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './Profile.css';

export default function Profile() {
  const { user } = useContext(AuthContext);

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Your Profile</h2>
        {user ? (
          <>
            <p className="profile-info">
              <strong>Name:</strong> {user.name}
            </p>
            <p className="profile-info">
              <strong>Email:</strong> {user.email}
            </p>
            {/* Add more fields here if needed */}
          </>
        ) : (
          <p className="profile-loading">Loading...</p>
        )}
      </div>
    </div>
  );
}
