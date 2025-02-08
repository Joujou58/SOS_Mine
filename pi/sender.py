import asyncio
import cv2
import json
import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame
import fractions

sio = socketio.AsyncClient()  # Socket.IO Client

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
    pc.addTrack(video_sender)

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
    await sio.connect("http://10.201.23.67:3000")  # Replace with your server IP
    await setup_webrtc()
    await sio.wait()

if __name__ == "__main__":
    asyncio.run(main())
