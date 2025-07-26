export class AudioMixer {
  private audioContext: AudioContext;
  private micGainNode: GainNode;
  private systemGainNode: GainNode;
  private destination: MediaStreamAudioDestinationNode;
  private micSource?: MediaStreamAudioSourceNode;
  private systemSource?: MediaStreamAudioSourceNode;

  constructor() {
    this.audioContext = new AudioContext();
    
    // Create gain nodes for volume control
    this.micGainNode = this.audioContext.createGain();
    this.systemGainNode = this.audioContext.createGain();
    
    // Create destination for mixed output
    this.destination = this.audioContext.createMediaStreamDestination();
    
    // Connect gain nodes to destination
    this.micGainNode.connect(this.destination);
    this.systemGainNode.connect(this.destination);
    
    // Set default volumes
    this.micGainNode.gain.value = 1.0;
    this.systemGainNode.gain.value = 0.7; // Lower system volume by default
  }

  addMicrophoneStream(stream: MediaStream) {
    this.micSource = this.audioContext.createMediaStreamSource(stream);
    this.micSource.connect(this.micGainNode);
    console.log('🎤 Microphone stream added to mixer');
  }

  addSystemStream(stream: MediaStream) {
    this.systemSource = this.audioContext.createMediaStreamSource(stream);
    this.systemSource.connect(this.systemGainNode);
    console.log('🔊 System stream added to mixer');
  }

  setMicrophoneVolume(volume: number) {
    this.micGainNode.gain.value = Math.max(0, Math.min(2, volume));
  }

  setSystemVolume(volume: number) {
    this.systemGainNode.gain.value = Math.max(0, Math.min(2, volume));
  }

  getMixedStream(): MediaStream {
    return this.destination.stream;
  }

  dispose() {
    this.micSource?.disconnect();
    this.systemSource?.disconnect();
    this.micGainNode.disconnect();
    this.systemGainNode.disconnect();
    this.destination.disconnect();
    this.audioContext.close();
    console.log('🗑️ AudioMixer disposed');
  }
}