import pyaudio
import wave

# Audio settings
DEVICE_INDEX = 2
FORMAT = pyaudio.paInt16  # 16-bit audio
CHANNELS = 1  # Mono audio
RATE = 16000  # Sampling rate in Hz
CHUNK = 960  # Buffer size
RECORD_SECONDS = 10  # Duration of the recording
OUTPUT_FILENAME = "output.wav"

p = pyaudio.PyAudio()

count = p.get_device_count()

for i in range(count):
    device_info = p.get_device_info_by_index(i)
    print(f"Device {i}: {device_info['name']} (input: {device_info['maxInputChannels']} channels, output: {device_info['maxOutputChannels']} channels)")

print("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
print(p.get_default_input_device_info())


stream = p.open(format=FORMAT, 
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK,
                input_device_index=DEVICE_INDEX)

print("allo allaoaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", stream)

print("Recording...")

frames = []

# Record audio
for _ in range(int(RATE / CHUNK * RECORD_SECONDS)):
    data = stream.read(CHUNK)
    frames.append(data)

print("Recording finished.")

stream.stop_stream()
stream.close()
p.terminate()

wf = wave.open(OUTPUT_FILENAME, 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(p.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames))
wf.close()

print("Done")
