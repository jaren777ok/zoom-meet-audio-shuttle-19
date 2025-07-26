
export class AudioMixer {
  private audioContext: AudioContext;
  private micGainNode: GainNode;
  private systemGainNode: GainNode;
  private destination: MediaStreamAudioDestinationNode;
  private micSource?: MediaStreamAudioSourceNode;
  private systemSource?: MediaStreamAudioSourceNode;
  private sources: Map<string, MediaStreamAudioSourceNode> = new Map();

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

  async addSource(stream: MediaStream, volume: number = 1.0) {
    // Determine if this is microphone or system audio based on existing sources
    const isMicrophone = this.sources.size === 0;
    const sourceType = isMicrophone ? 'microphone' : 'system';
    
    const source = this.audioContext.createMediaStreamSource(stream);
    this.sources.set(sourceType, source);
    
    if (isMicrophone) {
      this.micSource = source;
      source.connect(this.micGainNode);
      this.micGainNode.gain.value = volume;
      console.log('🎤 Microphone stream added to mixer');
    } else {
      this.systemSource = source;
      source.connect(this.systemGainNode);
      this.systemGainNode.gain.value = volume;
      console.log('🔊 System stream added to mixer');
    }
  }

  updateVolume(sourceType: 'microphone' | 'system', volume: number) {
    const clampedVolume = Math.max(0, Math.min(2, volume));
    
    if (sourceType === 'microphone') {
      this.micGainNode.gain.value = clampedVolume;
    } else if (sourceType === 'system') {
      this.systemGainNode.gain.value = clampedVolume;
    }
    
    console.log(`🔊 Updated ${sourceType} volume to ${clampedVolume}`);
  }

  getMixedStream(): MediaStream {
    return this.destination.stream;
  }

  destroy() {
    this.sources.forEach((source) => {
      source.disconnect();
    });
    this.sources.clear();
    
    this.micSource?.disconnect();
    this.systemSource?.disconnect();
    this.micGainNode.disconnect();
    this.systemGainNode.disconnect();
    this.destination.disconnect();
    this.audioContext.close();
    console.log('🗑️ AudioMixer destroyed');
  }

  // Legacy methods for backward compatibility
  addMicrophoneStream(stream: MediaStream) {
    this.addSource(stream, 1.0);
  }

  addSystemStream(stream: MediaStream) {
    this.addSource(stream, 0.7);
  }

  setMicrophoneVolume(volume: number) {
    this.updateVolume('microphone', volume);
  }

  setSystemVolume(volume: number) {
    this.updateVolume('system', volume);
  }

  dispose() {
    this.destroy();
  }
}
