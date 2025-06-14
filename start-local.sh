#!/bin/bash

echo "🚀 Starting Dragify Task Local Development"
echo "========================================="

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install-all
fi

# Start both backend and frontend
echo "🔧 Starting backend on http://localhost:4000"
echo "🌐 Starting frontend on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev
