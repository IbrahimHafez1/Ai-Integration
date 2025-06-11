import { Server as IOServer } from 'socket.io';
import http from 'http';
import { logger } from './logger.js';

let io: IOServer;

export function initSocket(server: http.Server) {
  io = new IOServer(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://*.replit.dev',
        process.env.FRONTEND_BASE_URL || '',
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('joinRoom', (userId: string) => {
      socket.join(userId);
      logger.info(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${error.message}`);
    });
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
  }
  return io;
}
