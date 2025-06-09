import { useContext, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { useLeadNotifications } from './hooks/useLeadNotifications';
import LeadNotification from './components/LeadNotification';

import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import IntegrationsPage from './pages/OAuth';
import SlackOAuthHandler from './pages/SlackOAuthHandler';
import LeadLogs from './pages/LeadLogs';
import CRMLogs from './pages/CRMLogs';

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, logout } = useContext(AuthContext);
  const [notification, setNotification] = useState(null);

  useLeadNotifications((newLead) => {
    setNotification(newLead);
  });

  return (
    <div>
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
              <Link to="/integrations" className="nav-link">
                Integrations
              </Link>
              <Link to="/logs/leads" className="nav-link">
                Lead Logs
              </Link>
              <Link to="/logs/crm" className="nav-link">
                CRM Logs
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

      <LeadNotification notification={notification} />

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
          path="/integrations"
          element={
            <PrivateRoute>
              <IntegrationsPage />
            </PrivateRoute>
          }
        />

        <Route path="/slack/callback" element={<SlackOAuthHandler />} />

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
          path="*"
          element={
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>404 - Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <Link to="/" className="nav-link">
                Go to Home
              </Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
