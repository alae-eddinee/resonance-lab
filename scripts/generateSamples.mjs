import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "samples");
mkdirSync(outDir, { recursive: true });

const SAMPLE_RATE = 44100;

function sine(freq, durationS, amplitude = 0.5) {
  const n = Math.floor(durationS * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE);
  fade(out);
  return out;
}

function dualTone(freqA, freqB, durationS, amplitude = 0.5) {
  const a = sine(freqA, durationS, amplitude / 2);
  const b = sine(freqB, durationS, amplitude / 2);
  const out = new Float32Array(a.length);
  for (let i = 0; i < out.length; i++) out[i] = a[i] + b[i];
  return out;
}

function harmonicSeries(fundamental, count, durationS, amplitude = 0.5) {
  const n = Math.floor(durationS * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let h = 1; h <= count; h++) {
    const amp = amplitude / h / count;
    for (let i = 0; i < n; i++) out[i] += amp * Math.sin((2 * Math.PI * fundamental * h * i) / SAMPLE_RATE);
  }
  fade(out);
  return out;
}

function sweep(startHz, endHz, durationS, amplitude = 0.5) {
  const n = Math.floor(durationS * SAMPLE_RATE);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = startHz + (endHz - startHz) * t;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    out[i] = amplitude * Math.sin(phase);
  }
  fade(out);
  return out;
}

function whiteNoise(durationS, amplitude = 0.3) {
  const n = Math.floor(durationS * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * (Math.random() * 2 - 1);
  fade(out);
  return out;
}

function pinkNoise(durationS, amplitude = 0.3) {
  const n = Math.floor(durationS * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rows = 16;
  const values = new Float32Array(rows);
  let runningSum = 0;
  for (let i = 0; i < n; i++) {
    let row = 0;
    let x = i;
    while ((x & 1) === 0 && x !== 0) {
      x >>= 1;
      row++;
    }
    row = Math.min(rows - 1, row);
    runningSum -= values[row];
    values[row] = Math.random() * 2 - 1;
    runningSum += values[row];
    out[i] = (runningSum / rows) * amplitude;
  }
  fade(out);
  return out;
}

function fade(samples, fadeS = 0.01) {
  const n = Math.floor(fadeS * SAMPLE_RATE);
  for (let i = 0; i < n && i < samples.length; i++) samples[i] *= i / n;
  for (let i = 0; i < n && i < samples.length; i++) samples[samples.length - 1 - i] *= i / n;
}

function encodeWav(samples, sampleRate) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s < 0 ? s * 0x8000 : s * 0x7fff), offset);
    offset += 2;
  }
  return buffer;
}

const files = {
  "tone-110hz.wav": sine(110, 2),
  "tone-220hz.wav": sine(220, 2),
  "tone-440hz.wav": sine(440, 2),
  "tone-880hz.wav": sine(880, 2),
  "dual-tone-440-660.wav": dualTone(440, 660, 2),
  "harmonic-series-220.wav": harmonicSeries(220, 6, 2),
  "sweep-100-2000.wav": sweep(100, 2000, 3),
  "white-noise.wav": whiteNoise(2),
  "pink-noise.wav": pinkNoise(2),
};

for (const [name, samples] of Object.entries(files)) {
  writeFileSync(path.join(outDir, name), encodeWav(samples, SAMPLE_RATE));
  console.log("Wrote", name);
}
