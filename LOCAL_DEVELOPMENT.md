# Local Development Setup

## Quick Start

1. **Run everything with one command:**
   ```bash
   ./start-local.sh
   ```

2. **Or run individually:**
   ```bash
   # Install dependencies
   npm run install-all
   
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately
   npm run dev:backend  # Backend on http://localhost:4000
   npm run dev:frontend # Frontend on http://localhost:3000
   ```

## Environment Configuration

### Frontend (http://localhost:3000)
- Uses `.env.local` for local development
- API calls go to `http://localhost:4000/api`
- OAuth redirects use localhost URLs

### Backend (http://localhost:4000)
- Uses `.env.development` for local development
- Connects to the same MongoDB database
- CORS configured to allow `http://localhost:3000`

## Important Notes

- **OAuth Providers**: You may need to add `http://localhost:4000/api/auth/*/callback` to your OAuth app configurations in Slack, Google, and Zoho
- **Database**: Uses the same production MongoDB instance
- **Environment Variables**: All sensitive credentials are already configured

## Switching Between Local and Production

### For Local Development:
- Frontend uses `.env.local` automatically
- Backend uses `.env.development` when NODE_ENV=development

### For Production:
- Frontend uses `.env.production` 
- Backend uses `.env` file when NODE_ENV=production

## OAuth Setup for Local Development

You may need to update your OAuth applications to include localhost URLs:

- **Slack**: Add `http://localhost:4000/api/auth/slack/callback`
- **Google**: Add `http://localhost:4000/api/auth/google/callback`  
- **Zoho**: Add `http://localhost:4000/api/auth/zoho/callback`
