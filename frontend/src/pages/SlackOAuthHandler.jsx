import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Modal from '../components/Modal';

export default function SlackOAuthHandler() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      setModal({ title: 'Error', message: 'Missing OAuth parameters.' });
      return;
    }
    apiClient
      .get('/slack/save-token', { params: { code, userToken: state } })
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
          navigate('/slack');
        }}
      />
    );
  }
  return null;
}
