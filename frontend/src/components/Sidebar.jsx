import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar dark">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <span className="brand-logo">D</span>
          <span className="brand-text">ragify</span>
        </Link>
      </div>
      <div className="sidebar-section">
        <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
          <i className="fas fa-home"></i> <span>Home</span>
        </Link>
        <Link to="/profile" className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}>
          <i className="fas fa-user"></i> <span>Profile</span>
        </Link>
        <Link
          to="/integrations"
          className={`sidebar-link ${isActive('/integrations') ? 'active' : ''}`}
        >
          <i className="fas fa-plug"></i> <span>Integration Manager</span>
        </Link>
        <Link
          to="/logs/leads"
          className={`sidebar-link ${isActive('/logs/leads') ? 'active' : ''}`}
        >
          <i className="fas fa-list"></i> <span>Lead Logs</span>
        </Link>
        <Link to="/logs/crm" className={`sidebar-link ${isActive('/logs/crm') ? 'active' : ''}`}>
          <i className="fas fa-database"></i> <span>CRM Logs</span>
        </Link>
      </div>
      <div className="sidebar-footer">
        <button onClick={logout} className="sidebar-logout">
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
