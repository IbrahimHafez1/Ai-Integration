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

  app.use(cors());
  app.use(express.json());
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

  app.use('/api', router);

  app.use('/api', (req, res, next) => {
    res.status(404).json({
      success: false,
      data: null,
      message: 'API route not found',
    });
  });

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Serve static files from frontend build
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));

  // Catch-all handler for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('../../frontend/dist/index.html'));
  });

  app.use(errorHandler);

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const port = process.env.PORT || 4000;
  httpServer.listen(port, () => {
    logger.info(`🚀 Server + WebSocket listening on port ${port}`);
  });
})();
