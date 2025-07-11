const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;
const distPath = path.join(__dirname, 'dist/angular-project');

const server = http.createServer((req, res) => {
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // Handle Angular routing - serve index.html for routes that don't exist as files
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html');
  }
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
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
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Angular AI Calendar app running on http://localhost:${port}`);
  console.log(`📅 Motion AI-inspired Calendar & Task Organizer is ready!`);
  console.log(`✨ Features: Google Calendar integration, AI scheduling, dark theme`);
  console.log(`🔗 Try opening: http://127.0.0.1:${port} or http://localhost:${port}`);
});