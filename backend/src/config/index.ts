import dotenv from 'dotenv';
dotenv.config();

export default {
  port: Number(process.env.PORT) || 4000,

  frontendBaseUrl: process.env.FRONTEND_BASE_URL as string,

  mongodbUri: process.env.MONGODB_URI as string,

  jwt: {
    secret: process.env.API_JWT_SECRET as string,
    expiresIn: '1h',
  },
  oauth: {
    slack: {
      clientId: process.env.SLACK_CLIENT_ID as string,
      clientSecret: process.env.SLACK_CLIENT_SECRET as string,
      redirectUri: process.env.SLACK_REDIRECT_URI as string,
    },
  },
};
