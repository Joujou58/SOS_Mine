import fs from 'fs';
import { WebSocket } from 'ws';

export function handleWebSocketConnection(ws: WebSocket) {
    console.log("Client connected (WebSocket for audio)");

    // Create a file stream with a unique filename (based on connection ID)
    const fileStream = fs.createWriteStream(`audio_${Date.now()}.raw`);

    ws.on("message", (message: any) => {
        // Handle and save audio data as Buffer
        console.log("Received audio data");
        console.log(message);
        fileStream.write(Buffer.from(message)); // Save audio data
    });

    ws.on("close", () => {
        console.log("Client disconnected (WebSocket)");
        fileStream.end();
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
}
