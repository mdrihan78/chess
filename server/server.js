
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

let rooms = {};

wss.on('connection', (ws) => {
  let roomId = null;
  let color = null;

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'join') {
      roomId = data.roomId;
      if (!rooms[roomId]) rooms[roomId] = [];
      if (rooms[roomId].length >= 2) {
        ws.send(JSON.stringify({ type: 'full' }));
        return;
      }
      rooms[roomId].push(ws);
      color = rooms[roomId].length === 1 ? 'white' : 'black';
      ws.send(JSON.stringify({ type: 'init', color }));
      if (rooms[roomId].length === 2) {
        rooms[roomId].forEach(s => s.send(JSON.stringify({ type: 'start' })));
      }
    } else if (data.type === 'move' && roomId && rooms[roomId]) {
      rooms[roomId].forEach(s => {
        if (s !== ws) s.send(JSON.stringify({ type: 'move', move: data.move }));
      });
    }
  });

  ws.on('close', () => {
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(s => s !== ws);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
