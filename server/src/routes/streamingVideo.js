// import socketIo from 'socket.io';
import { Server } from "socket.io";
import http from "http";
import { RTCPeerConnection, RTCSessionDescription } from "wrtc";

const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Public STUN server
};

const peerConnections = new Map();


io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
  
    socket.on("offer", async (offer) => {
      console.log(`Received offer from ${socket.id}`);
  
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnections.set(socket.id, peerConnection);
  
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", event.candidate);
        }
      };
  
      // Handle incoming video stream
      peerConnection.ontrack = (event) => {
        console.log("Received track from client", event.streams.length);
        io.emit("stream", event.streams[0]); // Relay stream to all clients
      };
  
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
  
      socket.emit("answer", answer);
    });
  
    // Handle ICE candidates
    socket.on("ice-candidate", (candidate) => {
      const peerConnection = peerConnections.get(socket.id);
      if (peerConnection) {
        peerConnection.addIceCandidate(candidate);
      }
    });
  
    // Clean up on disconnect
    socket.on("disconnect", () => {
      console.log(`Client ${socket.id} disconnected`);
      peerConnections.get(socket.id)?.close();
      peerConnections.delete(socket.id);
    });
  });