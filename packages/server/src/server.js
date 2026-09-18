// HTTP + WebSocket Server

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const roomManager = require('./room-manager');
const gameRegistry = require('./game-registry');
const protocol = require('./protocol');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'client', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' || urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for non-file routes
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data2);
      });
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function createServer() {
  const httpServer = http.createServer(serveStatic);

  const wss = new WebSocketServer({ server: httpServer });

  // Load game modules
  gameRegistry.loadGames();
  console.log(`🎮 Loaded ${gameRegistry.listGames().length} game(s):`,
    gameRegistry.listGames().map(g => `${g.emoji} ${g.name}`).join(', '));

  wss.on('connection', (ws) => {
    const playerId = uuidv4();
    ws.playerId = playerId;
    ws.roomCode = null;

    console.log(`🔗 Player connected: ${playerId}`);

    // Send player their ID immediately
    protocol.sendTo(ws, {
      type: 'connected',
      payload: { playerId, games: gameRegistry.listGames() },
    });

    ws.on('message', (raw) => {
      const msg = protocol.parseMessage(raw);
      if (!msg || !msg.type) return;

      const room = ws.roomCode ? roomManager.getRoomByCode(ws.roomCode) : null;

      protocol.handleMessage(ws, room, msg, wss);
    });

    ws.on('close', () => {
      console.log(`🔌 Player disconnected: ${playerId}`);
      if (ws.roomCode) {
        roomManager.leaveRoom(ws.roomCode, playerId, (room) => {
          if (room) {
            protocol.broadcast(room, {
              type: 'player_update',
              payload: roomManager.getRoomState(room),
            });
          }
        });
      }
    });

    ws.on('error', (err) => {
      console.error(`⚠️ WebSocket error for ${playerId}:`, err.message);
    });
  });

  return httpServer;
}

module.exports = { createServer };
