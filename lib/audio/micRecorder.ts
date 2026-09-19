export interface MicRecorderSession {
  recorder: MediaRecorder;
  chunks: Blob[];
}

export function startRecording(stream: MediaStream): MicRecorderSession {
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();
  return { recorder, chunks };
}

export function stopRecording(session: MicRecorderSession): Promise<Blob> {
  return new Promise((resolve) => {
    session.recorder.onstop = () => {
      resolve(new Blob(session.chunks, { type: session.recorder.mimeType || "audio/webm" }));
    };
    session.recorder.stop();
  });
}
