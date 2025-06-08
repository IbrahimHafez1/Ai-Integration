import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDB } from './database/data-source.js';
import { logger } from './utils/logger.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './utils/socket.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

(async () => {
  await connectDB(process.env.MONGODB_URI!);

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
    }),
  );

  // Replace with your production frontend domain
  const allowedOrigins = [
    'https://5d0c739d-620b-4833-b270-6da5909ef27a-00-38en1hwbeb1oi.kirk.replit.dev',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, origin);
        } else {
          callback(new Error('Blocked by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Authorization', 'Set-Cookie'],
    }),
  );

  app.use(express.json());
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

  app.use('/api', router);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(express.static(path.join(__dirname, '../../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });

  app.use(errorHandler);

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const port = process.env.PORT || 4000;
  httpServer.listen(port, () => {
    logger.info(`🚀 Server + WebSocket listening on port ${port}`);
  });
})();
