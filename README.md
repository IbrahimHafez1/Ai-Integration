# Dragify Task - Lead Management System

A modern full-stack application with React frontend and Node.js backend, featuring AI-powered lead processing, OAuth integrations, and real-time communication.

## Architecture

- **Backend**: Node.js/TypeScript API server with MongoDB and Zod validation
- **Frontend**: React application built with Vite
- **Deployment**: Backend on Render, Frontend can be deployed separately

## Features

- 🤖 AI-powered lead processing with Google Generative AI
- 🔐 OAuth Authentication (Google, Slack, Zoho)
- 📊 Lead and CRM log management
- 🔌 Real-time communication with Socket.IO
- 📈 Lead status tracking and analytics
- 🛡️ Type-safe validation with Zod
- 🚀 Production-ready with comprehensive error handling

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Required API keys (see Environment Variables)

### Installation

```bash
# Install dependencies for both backend and frontend
npm run install-all

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### Development

#### Full Stack Development
```bash
# Run both backend and frontend concurrently
npm run dev
```

#### Backend Only
```bash
cd backend
npm run dev
```

#### Frontend Only
```bash
cd frontend
npm run dev
```

The backend runs on port 4000, frontend development server on port 5173.

## Environment Variables

### Backend Environment Variables

Create `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/dragify-task

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Slack OAuth
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Zoho OAuth
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret

# AI Integration
GOOGLE_API_KEY=your_google_api_key

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend Environment Variables

Create `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_SLACK_CLIENT_ID=your_slack_client_id
VITE_SLACK_REDIRECT_URI=http://localhost:4000/api/auth/slack/callback
```

## Deployment

### Backend Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set root directory to `backend`
4. Render will automatically detect the `render.yaml` configuration
5. Add environment variables in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   ZOHO_CLIENT_ID=your_zoho_client_id
   ZOHO_CLIENT_SECRET=your_zoho_client_secret
   GOOGLE_API_KEY=your_google_api_key
   FRONTEND_BASE_URL=https://your-frontend.vercel.app
   ```
6. Deploy

### Frontend Deployment on Vercel

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Vercel will automatically detect it's a Vite project
4. Add environment variables in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-service.onrender.com/api
   VITE_SOCKET_URL=https://your-backend-service.onrender.com
   VITE_SLACK_CLIENT_ID=your_slack_client_id
   VITE_SLACK_REDIRECT_URI=https://your-backend-service.onrender.com/api/auth/slack/callback
   ```
5. Deploy

### Important Configuration Notes

1. **CORS Configuration**: The backend is configured to accept requests from your Vercel frontend domain
2. **OAuth Redirects**: Make sure all OAuth redirect URIs point to your Render backend URL
3. **Socket.IO**: Configure the frontend to connect to your Render backend for real-time features
4. **API Calls**: All frontend API calls will go to your Render backend

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoints and usage.

### Key Endpoints

- `POST /api/user/register` - User registration with Zod validation
- `POST /api/user/login` - User authentication
- `GET /api/auth/slack` - Slack OAuth flow
- `GET /api/logs/leads` - Lead management logs
- `POST /api/slack/events` - Slack webhook handler

## Scripts

### Root Level Scripts
```bash
npm run dev              # Run both backend and frontend
npm run dev:backend      # Run backend only
npm run dev:frontend     # Run frontend only
npm run install-all      # Install all dependencies
```

### Backend Scripts
```bash
npm run build           # Build TypeScript to JavaScript
npm run start           # Start production server
npm run dev             # Development with hot reload
npm run type-check      # TypeScript type checking
npm run lint            # ESLint
npm run lint:fix        # Fix ESLint issues
```

### Frontend Scripts
```bash
npm run dev             # Development server
npm run build           # Production build
npm run preview         # Preview production build
```

## Project Structure

```
dragify-task/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Main server file
│   ├── render.yaml          # Render deployment config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── contexts/        # React contexts
│   └── package.json
└── package.json             # Root package for development
```

## Technologies Used

### Backend
- **Runtime**: Node.js v18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Authentication**: JWT + OAuth 2.0
- **AI**: Google Generative AI
- **Real-time**: Socket.IO
- **Logging**: Winston

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: JavaScript/JSX
- **Styling**: CSS
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

### Development Tools
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **tsx**: TypeScript execution
- **concurrently**: Run multiple processes

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://your-domain.onrender.com/api/auth/google/callback`

### Slack OAuth
1. Go to [Slack API](https://api.slack.com/apps)
2. Create new app
3. Configure OAuth & Permissions
4. Add redirect URI: `https://your-domain.onrender.com/api/auth/slack/callback`

### Zoho OAuth
1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create application
3. Configure OAuth settings
4. Add redirect URI: `https://your-domain.onrender.com/api/auth/zoho/callback`

## Development

### Code Quality
- TypeScript for type safety
- Zod for runtime validation
- ESLint for code quality
- Comprehensive error handling
- Structured logging

### Testing
```bash
cd backend
npm run type-check    # TypeScript validation
npm run lint          # Code quality check
npm run build         # Build verification
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary. All rights reserved.
