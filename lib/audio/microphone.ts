export interface MicrophoneSession {
  audioContext: AudioContext;
  stream: MediaStream;
  sourceNode: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  monitorGain: GainNode;
}

export async function startMicrophone(fftSize: number): Promise<MicrophoneSession> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextCtor();
  if (audioContext.state === "suspended") await audioContext.resume();
  const sourceNode = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0;
  sourceNode.connect(analyser);

  // Monitor path is created but not connected to destination by default,
  // to avoid feedback/echo. setMicrophoneMonitoring() connects it on demand.
  const monitorGain = audioContext.createGain();
  monitorGain.gain.value = 0.6;
  sourceNode.connect(monitorGain);

  return { audioContext, stream, sourceNode, analyser, monitorGain };
}

export function setMicrophoneMonitoring(session: MicrophoneSession, enabled: boolean, volume = 0.6): void {
  session.monitorGain.gain.value = volume;
  try {
    session.monitorGain.disconnect();
  } catch {
    // was not connected
  }
  if (enabled) session.monitorGain.connect(session.audioContext.destination);
}

export async function stopMicrophone(session: MicrophoneSession): Promise<void> {
  for (const track of session.stream.getTracks()) track.stop();
  session.sourceNode.disconnect();
  session.monitorGain.disconnect();
  if (session.audioContext.state !== "closed") await session.audioContext.close();
}

export async function listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}
