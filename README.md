# AI App - Full Stack Application

A modern full-stack application with React frontend and Node.js backend, featuring AI integration, OAuth authentication, and real-time communication.

## Architecture

This project consists of two main components:

- **Backend**: Node.js/TypeScript API server with MongoDB
- **Frontend**: React application built with Vite

## Features

- 🤖 AI Integration with Hugging Face
- 🔐 OAuth Authentication (Google, Slack, Zoho)
- 📧 Email Notifications
- 🔌 Real-time Communication with Socket.IO
- 📊 MongoDB Database Integration
- 🚀 Deployed on Replit

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB account
- Required API keys (see Environment Variables section)

### Installation

1. Clone the repository
2. Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Development

#### Backend Development

```bash
# Build and start with auto-reload
npm run dev

# Or build and start production mode
npm start
```

#### Frontend Development

```bash
cd frontend
npm run dev
```

The backend will run on port 4000, and the frontend development server will typically run on port 5173.

## Environment Variables

### Backend (.env)

Create a `.env` file in the root directory with the following variables:

```env
PORT=4000
MONGODB_URI=your_mongodb_connection_string
API_JWT_SECRET=your_jwt_secret

# Slack OAuth
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=your_domain/api/auth/slack/callback

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Your App <your_email@gmail.com>

# Zoho OAuth
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REDIRECT_URI=your_domain/api/auth/zoho/callback

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_domain/api/auth/google/callback

# AI Integration
HF_TOKEN=your_hugging_face_token

# Frontend URL
FRONTEND_BASE_URL=your_domain
```

### Frontend (.env)

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=your_domain/api
VITE_SLACK_CLIENT_ID=your_slack_client_id
VITE_SLACK_REDIRECT_URI=your_domain/api/auth/slack/callback
VITE_SOCKET_URL=http://localhost:4000
```

## Available Scripts

### Backend Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and start the production server
- `npm run dev` - Build and start development server with auto-reload

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build

## Deployment

The application is currently deployed on Replit. For deployment:

1. Set up your environment variables in your hosting platform
2. Build the application:
   ```bash
   npm run build
   cd frontend && npm run build
   ```
3. Start the production server:
   ```bash
   npm start
   ```

## API Endpoints

The backend provides various API endpoints including:

- Authentication routes (`/api/auth/*`)
- User management
- AI integration endpoints
- Real-time socket connections

## OAuth Setup

This application supports multiple OAuth providers:

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your redirect URI

### Slack OAuth

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Configure OAuth & Permissions
4. Add your redirect URI

### Zoho OAuth

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create a new application
3. Configure OAuth settings
4. Add your redirect URI

## Technologies Used

- **Backend**: Node.js, TypeScript, Express.js, MongoDB, Socket.IO
- **Frontend**: React, Vite, TypeScript
- **Authentication**: OAuth 2.0 (Google, Slack, Zoho)
- **AI**: Hugging Face Transformers
- **Email**: Nodemailer with Gmail SMTP
- **Database**: MongoDB Atlas

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For questions or issues, please contact the development team or create an issue in the repository.

## License

This project is proprietary. All rights reserved.
