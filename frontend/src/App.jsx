import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';

import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SlackIntegration from './pages/SlackIntegration';
import SlackOAuthHandler from './pages/SlackOAuthHandler';
import LeadLogs from './pages/LeadLogs';
import CRMLogs from './pages/CRMLogs';
import TriggerConfigs from './pages/TriggerConfigs';

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      {/* ——— Updated Header ——— */}
      <nav className="nav-bar">
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            Dragify
          </Link>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
              <Link to="/slack" className="nav-link">
                Slack
              </Link>
              <Link to="/logs/leads" className="nav-link">
                Lead Logs
              </Link>
              <Link to="/logs/crm" className="nav-link">
                CRM Logs
              </Link>
              <Link to="/triggers" className="nav-link">
                Triggers
              </Link>
              <button onClick={logout} className="nav-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ——— Page Routes ——— */}
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/slack"
          element={
            <PrivateRoute>
              <SlackIntegration />
            </PrivateRoute>
          }
        />

        <Route
          path="/slack/oauth-callback"
          element={
            <PrivateRoute>
              <SlackOAuthHandler />
            </PrivateRoute>
          }
        />

        <Route
          path="/logs/leads"
          element={
            <PrivateRoute>
              <LeadLogs />
            </PrivateRoute>
          }
        />

        <Route
          path="/logs/crm"
          element={
            <PrivateRoute>
              <CRMLogs />
            </PrivateRoute>
          }
        />

        <Route
          path="/triggers"
          element={
            <PrivateRoute>
              <TriggerConfigs />
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="container">
              <h2>404 - Page not found</h2>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
