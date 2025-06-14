import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  google: {
    apiKey: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  zoho: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  slack: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
  frontend: {
    baseUrl: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

const requiredEnvVars = [
  'MONGODB_URI',
  'API_JWT_SECRET',
  'GOOGLE_API_KEY',
] as const;

const validateEnv = (): void => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

validateEnv();

export const config: Config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI!,
  },
  
  jwt: {
    secret: process.env.API_JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  google: {
    apiKey: process.env.GOOGLE_API_KEY!,
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
  
  zoho: {
    clientId: process.env.ZOHO_CLIENT_ID || '',
    clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
    redirectUri: process.env.ZOHO_REDIRECT_URI || '',
  },
  
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || '',
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },
  
  frontend: {
    baseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};

export default config;
