import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io("http://localhost:3000");
const videoElement = document.getElementById("remoteVideo");
const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

peerConnection.ontrack = (event) => {
    if (videoElement.srcObject !== event.streams[0]) {
        videoElement.srcObject = event.streams[0];
        console.log("Received remote stream");
    }
};

peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit("candidate", event.candidate);
    }
};

socket.on("offer", async (offer) => {
    console.log("Received offer");
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
    console.log("Received answer");
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", async (candidate) => {
    console.log("Received ICE candidate");
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});