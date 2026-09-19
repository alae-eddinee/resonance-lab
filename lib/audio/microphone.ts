export interface MicrophoneSession {
  audioContext: AudioContext;
  stream: MediaStream;
  sourceNode: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
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
  return { audioContext, stream, sourceNode, analyser };
}

export async function stopMicrophone(session: MicrophoneSession): Promise<void> {
  for (const track of session.stream.getTracks()) track.stop();
  session.sourceNode.disconnect();
  if (session.audioContext.state !== "closed") await session.audioContext.close();
}

export async function listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}
