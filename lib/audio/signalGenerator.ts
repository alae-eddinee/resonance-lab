export interface ToneOptions {
  frequencyHz: number;
  durationS: number;
  sampleRate: number;
  amplitude: number;
  fadeInS?: number;
  fadeOutS?: number;
}

function applyFades(samples: Float32Array, sampleRate: number, fadeInS = 0, fadeOutS = 0): void {
  const fadeInN = Math.floor(fadeInS * sampleRate);
  const fadeOutN = Math.floor(fadeOutS * sampleRate);
  for (let i = 0; i < fadeInN && i < samples.length; i++) samples[i] *= i / fadeInN;
  for (let i = 0; i < fadeOutN && i < samples.length; i++) {
    samples[samples.length - 1 - i] *= i / fadeOutN;
  }
}

export function generateSineWave(opts: ToneOptions): Float32Array {
  const n = Math.floor(opts.durationS * opts.sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = opts.amplitude * Math.sin((2 * Math.PI * opts.frequencyHz * i) / opts.sampleRate);
  }
  applyFades(out, opts.sampleRate, opts.fadeInS, opts.fadeOutS);
  return out;
}

export function generateDualTone(
  freqAHz: number,
  freqBHz: number,
  durationS: number,
  sampleRate: number,
  amplitude = 0.5,
): Float32Array {
  const a = generateSineWave({ frequencyHz: freqAHz, durationS, sampleRate, amplitude: amplitude / 2 });
  const b = generateSineWave({ frequencyHz: freqBHz, durationS, sampleRate, amplitude: amplitude / 2 });
  const out = new Float32Array(a.length);
  for (let i = 0; i < out.length; i++) out[i] = a[i] + b[i];
  return out;
}

export function generateHarmonicSeries(
  fundamentalHz: number,
  harmonicCount: number,
  durationS: number,
  sampleRate: number,
  amplitude = 0.5,
): Float32Array {
  const n = Math.floor(durationS * sampleRate);
  const out = new Float32Array(n);
  for (let h = 1; h <= harmonicCount; h++) {
    const harmAmp = amplitude / h / harmonicCount;
    for (let i = 0; i < n; i++) {
      out[i] += harmAmp * Math.sin((2 * Math.PI * fundamentalHz * h * i) / sampleRate);
    }
  }
  applyFades(out, sampleRate, 0.01, 0.01);
  return out;
}

export type SweepMode = "linear" | "logarithmic" | "stepped";

export function generateSweep(
  startHz: number,
  endHz: number,
  durationS: number,
  sampleRate: number,
  amplitude = 0.5,
  mode: SweepMode = "linear",
  steps = 8,
): Float32Array {
  const n = Math.floor(durationS * sampleRate);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let freq: number;
    if (mode === "logarithmic") {
      freq = startHz * Math.pow(endHz / startHz, t);
    } else if (mode === "stepped") {
      const stepIndex = Math.min(steps - 1, Math.floor(t * steps));
      freq = startHz + ((endHz - startHz) * stepIndex) / (steps - 1);
    } else {
      freq = startHz + (endHz - startHz) * t;
    }
    phase += (2 * Math.PI * freq) / sampleRate;
    out[i] = amplitude * Math.sin(phase);
  }
  applyFades(out, sampleRate, 0.01, 0.01);
  return out;
}

export function generateWhiteNoise(durationS: number, sampleRate: number, amplitude = 0.3): Float32Array {
  const n = Math.floor(durationS * sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * (Math.random() * 2 - 1);
  applyFades(out, sampleRate, 0.01, 0.01);
  return out;
}

/** Voss-McCartney approximation of pink noise (1/f spectrum). */
export function generatePinkNoise(durationS: number, sampleRate: number, amplitude = 0.3): Float32Array {
  const n = Math.floor(durationS * sampleRate);
  const out = new Float32Array(n);
  const rows = 16;
  const values = new Float32Array(rows);
  let runningSum = 0;
  for (let i = 0; i < n; i++) {
    const rowToUpdate = i === 0 ? 0 : Math.min(rows - 1, countTrailingZeros(i));
    runningSum -= values[rowToUpdate];
    values[rowToUpdate] = Math.random() * 2 - 1;
    runningSum += values[rowToUpdate];
    out[i] = (runningSum / rows) * amplitude;
  }
  applyFades(out, sampleRate, 0.01, 0.01);
  return out;
}

function countTrailingZeros(n: number): number {
  let count = 0;
  while ((n & 1) === 0 && n !== 0) {
    n >>= 1;
    count++;
  }
  return count;
}

/** Encodes mono Float32 samples as a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}
