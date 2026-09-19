export interface ToneOscillatorSession {
  audioContext: AudioContext;
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export function startTone(frequencyHz: number, volume: number): ToneOscillatorSession {
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = frequencyHz;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0;
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();

  return { audioContext, oscillator, gainNode };
}

export function setToneFrequency(session: ToneOscillatorSession, frequencyHz: number): void {
  session.oscillator.frequency.setTargetAtTime(frequencyHz, session.audioContext.currentTime, 0.01);
}

export function setToneVolume(session: ToneOscillatorSession, volume: number): void {
  session.gainNode.gain.setTargetAtTime(volume, session.audioContext.currentTime, 0.01);
}

export async function stopTone(session: ToneOscillatorSession): Promise<void> {
  const now = session.audioContext.currentTime;
  session.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
  session.oscillator.stop(now + 0.06);
  await new Promise((resolve) => setTimeout(resolve, 70));
  if (session.audioContext.state !== "closed") await session.audioContext.close();
}
