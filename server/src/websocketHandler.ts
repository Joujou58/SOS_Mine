import fs from 'fs';
import { WebSocket } from 'ws';

let listeners: WebSocket[] = []; // Store listeners (clients that will receive audio data)

export function handleWebSocketConnection(ws: WebSocket) {
    console.log("Client connected (WebSocket for audio)");

    // Create a file stream with a unique filename (based on connection ID)
    const fileStream = fs.createWriteStream(`audio_${Date.now()}.raw`);

    // When a message (audio data) is received from the sender client
    ws.on("message", (message: any) => {
        // console.log("Received audio data");

        // Handle and save audio data as Buffer
        fileStream.write(Buffer.from(message)); // Save audio data to a file

        // Broadcast audio data to all listening clients
        listeners.forEach(listener => {
            if (listener.readyState === WebSocket.OPEN) {
                // console.log("Sending audio data to listener");
                listener.send(message); // Send audio data to listeners
            }
        });
    });

    // Handle WebSocket close event
    ws.on("close", () => {
        console.log("Client disconnected (WebSocket)");

        // Remove from listeners when disconnected
        listeners = listeners.filter(listener => listener !== ws);
        fileStream.end(); // Close the file stream
    });

    // Handle WebSocket errors
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
}

// Function to add a listener
export function addListener(ws: WebSocket) {
    console.log("New listener connected!");
    listeners.push(ws); // Add to listeners
}
