import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/voice-transcription'
});

// Store connected clients
const clients = new Set();

console.log('🎤 Voice Transcription WebSocket Server Starting...');

wss.on('connection', (ws, req) => {
  console.log('🔗 New WebSocket connection established');
  clients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_status',
    message: 'Connected to voice transcription server',
    timestamp: Date.now()
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'voice_transcript':
          console.log('🎤 Voice transcript received:', message.data);
          
          // Broadcast to all connected clients (for demo purposes)
          clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({
                type: 'voice_transcript_broadcast',
                data: message.data,
                timestamp: message.timestamp,
                source: 'voice_input'
              }));
            }
          });
          
          // Send acknowledgment back to sender
          ws.send(JSON.stringify({
            type: 'transcript_received',
            message: 'Voice transcript processed successfully',
            timestamp: Date.now()
          }));
          break;

        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;

        default:
          console.log('📨 Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clients.delete(ws);
  });
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'voice-transcription-websocket',
      connections: clients.size,
      timestamp: Date.now()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
const PORT = process.env.WEBSOCKET_PORT || 5001;
server.listen(PORT, () => {
  console.log(`🎤 Voice Transcription WebSocket Server running on port ${PORT}`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}/voice-transcription`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

export { wss, server }; 