import { Server as IOServer } from 'socket.io';
import http from 'http';
import logger from './logger.js';
import config from '../config/index.js';

let io: IOServer;

export function initSocket(server: http.Server) {
  const allowedOrigins = config.nodeEnv === 'production'
    ? [
        'https://ai-integration-1ojr.vercel.app',
        config.frontend.baseUrl,
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ];

  io = new IOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    path: '/socket.io',
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false,
    allowEIO3: true,
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
