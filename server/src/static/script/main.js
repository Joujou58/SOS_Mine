import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io("http://localhost:3000");
const videoElement = document.getElementById("remoteVideo");
const remoteStream = new MediaStream();  // Store both audio and video tracks
videoElement.srcObject = remoteStream;


let microIsMuted = false;

const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// Handle incoming tracks (video + audio)
peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);  // Add both video and audio tracks
    });
    console.log("Received remote track:", event.track.kind);
};

// Send ICE candidates
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit("candidate", event.candidate);
    }
};

// Handle offer from the sender
socket.on("offer", async (offer) => {
    console.log("Received offer");
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

// Handle answer from the sender
socket.on("answer", async (answer) => {
    console.log("Received answer");
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle incoming ICE candidates
socket.on("candidate", async (candidate) => {
    console.log("Received ICE candidate");
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

initalizeMuteButton();



function initalizeMuteButton() {
    const audioButton = document.getElementById("mute-button");

    audioButton.addEventListener('click', () => {
        if(!microIsMuted) {
            audioButton.classList.remove('mic-on');
            audioButton.classList.add('mic-off');
            microIsMuted = true;
        }
        else {
            audioButton.classList.remove('mic-off');
            audioButton.classList.add('mic-on');
            microIsMuted = false;
        }
    });
}

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule("script/processor.js");

    const source = audioContext.createMediaStreamSource(stream);
    const processorNode = new AudioWorkletNode(audioContext, "audio-processor");

    // Create an analyser node to calculate the amplitude of the audio signal
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;  // Set FFT size for analysis (you can adjust this)
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyser.connect(processorNode);

    const ws = new WebSocket("ws://localhost:3000/webtopi");

    ws.onopen = () => console.log("WebToPi WebSocket connected");
    ws.onclose = () => console.log("WebToPi WebSocket CLOSED");

    const threshold = 20; // Minimum amplitude threshold (adjust as needed)

    processorNode.port.onmessage = (event) => {
        analyser.getByteFrequencyData(dataArray);  // Get frequency data

        // Calculate the RMS (Root Mean Square) of the frequency data to get the volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i] ** 2;
        }

        const rms = Math.sqrt(sum / bufferLength);  // RMS calculation
        if (rms > threshold && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data); // Send audio data if volume exceeds threshold
        }
    };

    source.connect(processorNode); // Connect the source to the processor node
}




(async function() {await startRecording()})();
