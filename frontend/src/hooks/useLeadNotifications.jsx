import { useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';

let socket;

export function useLeadNotifications(onLeadCreated) {
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    if (!user?._id || !token) {
      return;
    }

    const socketUrl = window.location.origin.replace('http', 'ws');

    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      path: '/socket.io',
      secure: true,
      rejectUnauthorized: false,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('joinRoom', user._id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });

    socket.on('leadCreated', (payload) => {
      onLeadCreated(payload);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token, onLeadCreated]);
}
