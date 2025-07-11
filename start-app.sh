#!/bin/bash

echo "🚀 Starting Angular AI Calendar & Task Organizer..."
echo "📅 Motion AI-inspired Calendar with Google Calendar Integration"
echo ""

# Kill any existing processes
pkill -f "ng serve" 2>/dev/null
pkill -f "node server.js" 2>/dev/null

# Navigate to project directory
cd "$(dirname "$0")"

# Build the application
echo "📦 Building application..."
npm run build

# Start the server
echo "🌐 Starting server..."
echo ""
echo "✨ Application will be available at:"
echo "   → http://localhost:8080"
echo "   → http://127.0.0.1:8080"
echo "   → http://0.0.0.0:8080"
echo ""
echo "🔧 If you can't access the app:"
echo "   1. Check your firewall settings"
echo "   2. Try disabling VPN/proxy"
echo "   3. Use 'npm start' for dev server instead"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================================"

# Start the Node.js server
node server.js