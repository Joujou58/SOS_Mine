import { Socket } from "socket.io";

// WebRTC signaling handlers
export function handleWebRTCConnection(socket: Socket): void {
    console.log("Client connected (WebRTC)");

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
        console.log("WebRTC client disconnected");
    });
}
