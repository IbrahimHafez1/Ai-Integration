import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDB } from './database/data-source.js';
import logger from './utils/logger.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './utils/socket.js';
import config from './config/config.js';

const app = express();
const httpServer = http.createServer(app);

const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  httpServer.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    logger.info('Server closed successfully');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

let dbRetries = 0;
const maxDbRetries = 5;

const connectWithRetry = async () => {
  try {
    await connectDB(config.mongodb.uri);
    logger.info('Connected to MongoDB');
    dbRetries = 0;
  } catch (error) {
    dbRetries++;
    logger.error(`Database connection failed (attempt ${dbRetries}/${maxDbRetries}):`, error);

    if (dbRetries < maxDbRetries) {
      logger.info(`Retrying database connection in ${dbRetries * 2} seconds...`);
      setTimeout(connectWithRetry, dbRetries * 2000);
    } else {
      logger.error('Max database connection retries reached. Exiting...');
      process.exit(1);
    }
  }
};

connectWithRetry();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins =
        config.nodeEnv === 'production'
          ? [
              config.frontend.baseUrl,
              'https://ai-integration-1ojr.vercel.app',
              'https://chat-app-hq3n.onrender.com',
            ]
          : [
              'http://localhost:3000',
              'http://localhost:5173',
              'http://127.0.0.1:3000',
              'http://127.0.0.1:5173',
            ];

      // Check if origin is in allowed list or is a Vercel app domain
      const isAllowed =
        allowedOrigins.includes(origin) ||
        (config.nodeEnv === 'production' && origin.endsWith('.vercel.app'));

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'X-Request-ID'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  }),
);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Explicit OPTIONS handler for preflight requests
app.options('*', (req, res) => {
  res.status(200).end();
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  }),
);

const createRateLimit = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });

app.use('/api/auth', createRateLimit(15 * 60 * 1000, 50, 'Too many authentication attempts'));
app.use(
  '/api',
  createRateLimit(config.rateLimit.windowMs, config.rateLimit.max, 'Too many API requests'),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health',
  }),
);

app.use('/api', router);

app.use(errorHandler);

try {
  initSocket(httpServer);
  logger.info('WebSocket initialized successfully');
} catch (error) {
  logger.error('Failed to initialize WebSocket:', error);
}

const port = parseInt(process.env.PORT || config.port.toString(), 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

httpServer
  .listen(port, host, () => {
    logger.info(`🚀 Server listening on http://${host}:${port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info('Health check available at: /health');
  })
  .on('error', (error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

export default app;
