const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8888;
const distPath = path.join(__dirname, 'dist/angular-project');

console.log('🚀 Starting HTTP server on port', port);
console.log('📁 Serving from:', distPath);
console.log('🌐 Open: http://localhost:' + port);

const server = http.createServer((req, res) => {
  console.log('📥 Request:', req.url);
  
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // Only serve index.html for routes that don't exist as files AND don't have file extensions
  if (!fs.existsSync(filePath)) {
    if (path.extname(req.url) === '') {
      // No file extension, likely an Angular route
      filePath = path.join(distPath, 'index.html');
    } else {
      // Has file extension but doesn't exist, return 404
      console.log('❌ File not found:', filePath);
    }
  }
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'application/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error('❌ Error reading file:', filePath, err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error: ' + err.message);
    } else {
      console.log('✅ Serving:', path.basename(filePath), '(' + contentType + ')');
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
      if (contentType.startsWith('text/') || contentType === 'application/javascript' || contentType === 'application/json') {
        res.end(content, 'utf-8');
      } else {
        res.end(content);
      }
    }
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log('✅ Server running successfully!');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});