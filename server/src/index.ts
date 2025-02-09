import express from 'express';
import path from 'path';
import RouteManager from './routes/routeManager';
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer } from 'ws';
import { createServer } from "http";
import { handleWebRTCConnection } from './webrtcHandler';
import { handleWebSocketConnection, addListener } from './websocketHandler';

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
const wssWebToPi = new WebSocketServer({ 
    noServer: true 
});

// WebSocket for listening to audio stream on the /listen endpoint
const wssListen = new WebSocketServer({ 
    noServer: true 
});

// Handle WebSocket upgrade manually for /webtopi endpoint
server.on('upgrade', (request, socket, head) => {
    if (request.url === '/webtopi') {
        wssWebToPi.handleUpgrade(request, socket, head, (ws) => {
            wssWebToPi.emit('connection', ws, request);
        });
    } else if (request.url === '/listen') {
        wssListen.handleUpgrade(request, socket, head, (ws) => {
            wssListen.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// Handle WebSocket connections for /webtopi (audio data senders)
wssWebToPi.on("connection", handleWebSocketConnection);

// Handle WebSocket connections for /listen (audio data receivers)
wssListen.on("connection", (ws) => {
    console.log("Client connected to /listen endpoint");

    // Add this client as a listener
    addListener(ws);

    ws.on("message", (message) => {
        // Process the incoming audio data and send to all other clients connected to /listen
        wssListen.clients.forEach((client) => {
            if (client !== ws && client.readyState === client.OPEN) {
                client.send(message);  // Send audio data to all clients except the sender
            }
        });
    });

    ws.on("close", () => {
        console.log("Client disconnected from /listen endpoint");
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
