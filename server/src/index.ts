import express from 'express';
import path from 'path';
import RouteManager from './routes/routeManager';
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer } from 'ws';
import { createServer } from "http";
import { handleWebRTCConnection } from './webrtcHandler';
import { handleWebSocketConnection } from './websocketHandler';

const app = express();
const port = 3000;

const routeManager = new RouteManager(path.join(__dirname, '/static'));
app.use(routeManager.initializeRoutes());

const server = createServer(app);

// Keep Socket.IO for WebRTC signaling
const io = new SocketIOServer(server, {
    cors: { origin: "*" }
});

// Handle WebRTC connections using the handler function from webrtcHandler.ts
io.on("connection", handleWebRTCConnection);

// WebSocket for Audio Streaming on the /webtopi endpoint
const wss = new WebSocketServer({ 
    noServer: true 
});

// Handle WebSocket upgrade manually for /webtopi endpoint
server.on('upgrade', (request, socket, head) => {
    // Check if the incoming request is for the /webtopi endpoint
    if (request.url === '/webtopi') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        // If it's not the /webtopi endpoint, pass it along
        socket.destroy();
    }
});

// Use the function from websocketHandler.ts for WebSocket connection handling
wss.on("connection", handleWebSocketConnection);  // Handle WebSocket connections for audio

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
