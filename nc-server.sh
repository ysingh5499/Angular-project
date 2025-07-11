#!/bin/bash

cd /Users/yuvraj/IdeaProjects/Angular-project/dist/angular-project

echo "🚀 Starting netcat HTTP server on port 8888..."
echo "📍 Open: http://localhost:8888"
echo "🔧 Press Ctrl+C to stop"

while true; do
    echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n$(cat index.html)" | nc -l 8888
done