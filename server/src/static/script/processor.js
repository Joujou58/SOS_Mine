class AudioProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (input.length > 0) {
            this.port.postMessage(input[0]); // Send audio buffer to main thread
        }
        return true;
    }
}
registerProcessor("audio-processor", AudioProcessor);
