import { useContext, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { useLeadNotifications } from './hooks/useLeadNotifications';
import LeadNotification from './components/LeadNotification';
import Sidebar from './components/Sidebar';

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
  const { user } = useContext(AuthContext);
  const [notification, setNotification] = useState(null);

  useLeadNotifications((newLead) => {
    setNotification(newLead);
  });

  return (
    <div className="app-container">
      <Sidebar />

      <main className={`main-content ${user ? 'with-sidebar' : ''}`}>
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
      </main>
    </div>
  );
}
