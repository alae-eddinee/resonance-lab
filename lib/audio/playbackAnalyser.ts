export interface PlaybackSession {
  audioContext: AudioContext;
  sourceNode: AudioBufferSourceNode;
  analyser: AnalyserNode;
  gainNode: GainNode;
}

export function startPlaybackAnalysis(
  samples: Float32Array,
  sampleRate: number,
  startS: number,
  endS: number,
  fftSize: number,
  loop = true,
  volume = 0.8,
): PlaybackSession {
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextCtor();
  const startSample = Math.floor(startS * sampleRate);
  const endSample = Math.min(samples.length, Math.floor(endS * sampleRate));
  const selection = samples.subarray(startSample, Math.max(startSample + 1, endSample));

  const buffer = audioContext.createBuffer(1, selection.length, sampleRate);
  buffer.copyToChannel(Float32Array.from(selection), 0);

  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  sourceNode.loop = loop;

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  sourceNode.connect(analyser);
  analyser.connect(gainNode);
  gainNode.connect(audioContext.destination);
  sourceNode.start();

  return { audioContext, sourceNode, analyser, gainNode };
}

export function setPlaybackVolume(session: PlaybackSession, volume: number): void {
  session.gainNode.gain.value = volume;
}

export async function stopPlaybackAnalysis(session: PlaybackSession): Promise<void> {
  try {
    session.sourceNode.stop();
  } catch {
    // already stopped
  }
  session.sourceNode.disconnect();
  if (session.audioContext.state !== "closed") await session.audioContext.close();
}
