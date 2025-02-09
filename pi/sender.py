import asyncio
import cv2
import json
import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, AudioStreamTrack
from aiortc.contrib.media import MediaStreamTrack
from av import VideoFrame, AudioFrame
import fractions
import numpy as np
import pyaudio

sio = socketio.AsyncClient()  # Socket.IO Client

class CustomAudioStreamTrack(AudioStreamTrack):
    def __init__(self, rate=22050, channels=1):
        super().__init__()
        self.rate = rate
        self.channels = channels
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=self.channels,
            rate=self.rate,
            input=True,
            frames_per_buffer=960
        )

    async def recv(self):
        audio_data = self.stream.read(960, exception_on_overflow=False)
        audio_array = np.frombuffer(audio_data, dtype=np.int16)

        audio_frame = AudioFrame(format="s16", layout="mono", samples=960)
        audio_frame.planes[0].update(audio_array.tobytes())
        audio_frame.sample_rate = self.rate
        return audio_frame

class CustomVideoStreamTrack(VideoStreamTrack):
    def __init__(self, camera_id):
        super().__init__()
        self.cap = cv2.VideoCapture(camera_id)
        self.frame_count = 0

    async def recv(self):
        self.frame_count += 1
        ret, frame = self.cap.read()
        if not ret:
            print("Failed to read frame from camera")
            return None
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        video_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        video_frame.pts = self.frame_count
        video_frame.time_base = fractions.Fraction(1, 30)
        return video_frame

class AudioPlayer:
    """Plays received audio through speakers."""
    
    def __init__(self, rate=22050, channels=1):
        self.rate = rate
        self.channels = channels
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=self.channels,
            rate=self.rate,
            output=True,
            frames_per_buffer=960
        )

    def play_audio(self, frame: AudioFrame):
        """Plays received audio frame."""
        audio_data = frame.planes[0].to_bytes()
        self.stream.write(audio_data)

async def setup_webrtc():
    pc = RTCPeerConnection()
    video_sender = CustomVideoStreamTrack(0)
    audio_sender = CustomAudioStreamTrack()
    pc.addTrack(video_sender)
    pc.addTrack(audio_sender)

    # Audio player to output received audio
    audio_player = AudioPlayer()

    @pc.on("track")
    def on_track(track: MediaStreamTrack):
        if isinstance(track, AudioStreamTrack):
            print("Received an audio track")

            async def play_audio():
                """Continuously receive and play audio."""
                while True:
                    try:
                        frame = await track.recv()  # Receive audio frame
                        audio_player.play_audio(frame)  # Play the received frame
                    except Exception as e:
                        print("Audio playback error:", e)
                        break
            
            asyncio.create_task(play_audio())  # Run in background
    
    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        if candidate:
            await sio.emit("candidate", {"candidate": candidate.to_json()})
    
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    await sio.emit("offer", {"sdp": pc.localDescription.sdp, "type": "offer"})

    @sio.event
    async def answer(data):
        print("Received answer")
        await pc.setRemoteDescription(RTCSessionDescription(data["sdp"], data["type"]))

async def main():
    await sio.connect("http://10.201.23.66:3000")  # Replace with your server IP
    await setup_webrtc()
    await sio.wait()

if __name__ == "__main__":
    asyncio.run(main())
