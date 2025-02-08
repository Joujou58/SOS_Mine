import express from 'express';
import path from 'path';
import RouteManager from './routes/routeManager';
import { Server } from "socket.io";
import http from "http";


const app = express();
const port = 3000;

const routeManager = new RouteManager(path.join(__dirname, '/static'));
app.use(routeManager.initializeRoutes());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Change this for production
    methods: ["GET", "POST"],
  },
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

