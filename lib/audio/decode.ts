export interface DecodedAudio {
  samples: Float32Array;
  sampleRate: number;
  channels: number;
  durationS: number;
}

export async function decodeAudioFile(file: Blob): Promise<DecodedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextCtor();
  try {
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    const channels = buffer.numberOfChannels;
    const mono = new Float32Array(buffer.length);
    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) mono[i] += data[i] / channels;
    }
    return { samples: mono, sampleRate: buffer.sampleRate, channels, durationS: buffer.duration };
  } finally {
    await audioContext.close();
  }
}
