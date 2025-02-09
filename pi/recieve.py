import websocket
import pyaudio
import numpy as np
import struct

# Define audio stream parameters
sample_rate = 44100  # Sample rate (Hz)
channels = 1  # Mono audio
bit_depth = 16  # 16-bit depth
chunk_size = 1024  # Buffer size for each chunk

# Initialize PyAudio
p = pyaudio.PyAudio()

# Open audio stream for playback
stream = p.open(format=pyaudio.paInt16,  # Format for 16-bit signed PCM
                channels=channels,
                rate=sample_rate,
                output=True,
                frames_per_buffer=chunk_size)

# Define WebSocket callback functions
def on_message(ws, message):
    try:
        # Convert incoming message (bytes) to audio data
        audio_data = np.frombuffer(message, dtype=np.int16)  # Assuming 16-bit signed PCM
        stream.write(audio_data.tobytes())  # Play audio directly
    except Exception as e:
        print(f"Error processing audio data: {e}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Closed connection")

def on_open(ws):
    print("Connected to WebSocket server")


def main():
    # Establish WebSocket connection to the server
    ws = websocket.WebSocketApp("ws://localhost:3000/listen",  # WebSocket server URL
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)

    # Start WebSocket communication
    ws.on_open = on_open
    ws.run_forever()
