import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDB } from './database/data-source.js';
import logger from './utils/logger.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './utils/socket.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables from root directory in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
}

const app = express();
const httpServer = http.createServer(app);

// Initialize database connection
(async () => {
  try {
    await connectDB(process.env.MONGODB_URI!);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Database connection failed:', error);
  }
})();

app.set('trust proxy', 1);

// Configure CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_BASE_URL
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
  }),
);

app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.use('/', router);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(errorHandler);

// Initialize WebSocket with CORS configuration
initSocket(httpServer);

const port = parseInt(process.env.PORT || '4000', 10);

if (process.env.VERCEL !== '1') {
  httpServer.listen({ port, host: '0.0.0.0' }, () => {
    logger.info(`🚀 Server listening on http://localhost:${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info('Try health check at: http://localhost:4000/health');
  });
}

export default app;
