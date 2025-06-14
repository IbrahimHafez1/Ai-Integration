#!/bin/bash

echo "Testing backend server startup..."

cd backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the project
echo "Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Test type checking
echo "Running type check..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ Type check passed"
else
    echo "❌ Type check failed"
    exit 1
fi

echo "✅ All tests passed! Backend is ready for deployment."
echo ""
echo "To deploy on Render:"
echo "1. Connect your GitHub repo to Render"
echo "2. Create a new Web Service"
echo "3. Set the root directory to 'backend'"
echo "4. Render will use the render.yaml configuration automatically"
echo "5. Add your environment variables in Render dashboard"
