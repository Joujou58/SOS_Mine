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

function getLocalAudioStream() {
    navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
            // window.localStream = stream;
            // window.localAudio.srcObject = stream;
            // window.localAudio.autoplay = true;

            window.localStream = stream;

            stream.getAudioTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });

            // Play the local audio to confirm it's working
            // const localAudio = document.createElement("audio");
            // localAudio.srcObject = stream;
            // localAudio.autoplay = true;
            // document.body.appendChild(localAudio);
    })
    .catch((err) => {
        console.error(`you got an error: ${err}`);
    });
}

getLocalAudioStream();
