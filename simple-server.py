#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Serve index.html for all routes (Angular SPA routing)
        if not os.path.exists(self.translate_path(self.path)):
            self.path = '/index.html'
        return super().do_GET()

# Change to the dist directory
os.chdir('/Users/yuvraj/IdeaProjects/Angular-project/dist/angular-project')

PORT = 9000
Handler = MyHTTPRequestHandler

print(f"🚀 Starting Python HTTP Server on port {PORT}")
print(f"📍 Serving from: {os.getcwd()}")
print(f"🌐 Open in browser:")
print(f"   → http://localhost:{PORT}")
print(f"   → http://127.0.0.1:{PORT}")
print(f"   → http://0.0.0.0:{PORT}")
print("🔧 Press Ctrl+C to stop")
print("=" * 50)

try:
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n🛑 Server stopped")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)