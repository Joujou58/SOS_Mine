import asyncio
import cv2
# import json
import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, AudioStreamTrack
from av import VideoFrame, AudioFrame
import fractions
import numpy as np
import pyaudio
import time

print("allo")

bufferSize = 512
audioHz = 16000

sio = socketio.AsyncClient()  # Socket.IO Client

class CustomAudioStreamTrack(AudioStreamTrack):
    def __init__(self, rate=audioHz, channels=1):
        super().__init__()
        self.rate = rate
        self.channels = channels
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=self.channels,
            rate=self.rate,
            input=True,
            frames_per_buffer=bufferSize,
            input_device_index=1
        )

    async def recv(self):
        samples = int(bufferSize)

        if hasattr(self, "_timestamp"):
            self._timestamp += samples
            wait = self._start + (self._timestamp / audioHz) - time.time()
            await asyncio.sleep(wait)
        else:
            self._start = time.time()
            self._timestamp = 0
        audio_data = self.stream.read(bufferSize, exception_on_overflow=False)
        audio_array = np.frombuffer(audio_data, dtype=np.int16)

        audio_frame = AudioFrame(format="s16", layout="mono", samples=bufferSize)
        audio_frame.planes[0].update(audio_array.tobytes())
        audio_frame.pts = self._timestamp # Leave `None` to let aiortc handle timestamps
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

async def setup_webrtc():
    pc = RTCPeerConnection()
    video_sender = CustomVideoStreamTrack(0)
    audio = CustomAudioStreamTrack()
    pc.addTrack(video_sender)
    pc.addTrack(audio)

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
    print("allo")
    await sio.connect("http://localhost:3000")  # Replace with your server IP
    print("allo")
    await setup_webrtc()
    await sio.wait()

if __name__ == "__main__":
    asyncio.run(main())
