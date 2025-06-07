import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(name.trim(), email.trim(), password);
      setSuccess('Registration successful! Redirecting to login...');
      navigate('/login');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('User already exists. Please login instead.');
      } else {
        setError(err.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Dragify</h1>
        </div>
        <h2>Create Your Account</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              id="name"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!!success}
            />
            <label htmlFor="name">Full Name</label>
          </div>

          <div className="form-group">
            <input
              type="email"
              id="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!success}
            />
            <label htmlFor="email">Email Address</label>
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!!success}
            />
            <label htmlFor="password">Password</label>
          </div>

          <button type="submit" className="auth-btn" disabled={!!success}>
            Register
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
