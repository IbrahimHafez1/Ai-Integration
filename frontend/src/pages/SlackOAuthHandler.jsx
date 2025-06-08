import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import './SlackOAuthHandler.css';

export default function SlackOAuthHandler() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      setModal({ title: 'Error', message: 'Missing OAuth parameters.' });
      return;
    }
    axios
      .get('/slack/save-token', {
        params: {
          code,
          userId: state,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setModal({ title: 'Success', message: res.data.message || 'Connected!' });
      })
      .catch((err) => {
        setModal({ title: 'Error', message: err.response?.data?.message || err.message });
      });
  }, []);

  if (modal) {
    return (
      <Modal
        title={modal.title}
        message={modal.message}
        onClose={() => {
          navigate('/integrations');
        }}
      />
    );
  }
  return null;
}
