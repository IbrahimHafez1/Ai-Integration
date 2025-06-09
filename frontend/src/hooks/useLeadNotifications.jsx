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

    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('joinRoom', user._id);
    });

    socket.on('connect_error', (err) => {});

    socket.on('leadCreated', (payload) => {
      onLeadCreated(payload);
    });

    return () => socket.disconnect();
  }, [user, token, onLeadCreated]);
}
