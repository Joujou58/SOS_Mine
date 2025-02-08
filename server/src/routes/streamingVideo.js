import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("offer", (offer) => {
        console.log("Received offer");
        socket.broadcast.emit("offer", offer);
    });

    socket.on("answer", (answer) => {
        console.log("Received answer");
        socket.broadcast.emit("answer", answer);
    });

    socket.on("candidate", (candidate) => {
        console.log("Received ICE candidate");
        socket.broadcast.emit("candidate", candidate);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

export default io