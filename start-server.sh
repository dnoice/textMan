#!/bin/bash
# Simple HTTP server for testing textMan on mobile

echo "🚀 Starting textMan local server..."
echo ""
echo "📱 Open one of these URLs in your phone's browser:"
echo ""
echo "   For debug page:    http://localhost:8000/mobile-debug.html"
echo "   For main app:      http://localhost:8000/index.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000
