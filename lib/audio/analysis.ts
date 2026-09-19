import { binToFrequency } from "./fft";

export function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

export function peakAmplitude(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  return peak;
}

export function amplitudeToDbfs(amplitude: number): number {
  return amplitude <= 0 ? -Infinity : 20 * Math.log10(amplitude);
}

export function zeroCrossingRate(samples: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i - 1] >= 0) !== (samples[i] >= 0)) crossings++;
  }
  return crossings / (2 * samples.length);
}

export interface SpectralPeak {
  bin: number;
  frequencyHz: number;
  magnitude: number;
}

export function findSpectralPeaks(
  magnitudes: Float32Array,
  sampleRate: number,
  fftSize: number,
  options: { count?: number; noiseFloor?: number; minFrequencyHz?: number; maxFrequencyHz?: number } = {},
): SpectralPeak[] {
  const { count = 5, noiseFloor = 0.001, minFrequencyHz = 20, maxFrequencyHz = sampleRate / 2 } = options;
  const candidates: SpectralPeak[] = [];
  for (let i = 2; i < magnitudes.length - 2; i++) {
    const freq = binToFrequency(i, sampleRate, fftSize);
    if (freq < minFrequencyHz || freq > maxFrequencyHz) continue;
    const m = magnitudes[i];
    if (m < noiseFloor) continue;
    if (m >= magnitudes[i - 1] && m >= magnitudes[i + 1] && m > magnitudes[i - 2] && m > magnitudes[i + 2]) {
      candidates.push({ bin: i, frequencyHz: freq, magnitude: m });
    }
  }
  return candidates.sort((a, b) => b.magnitude - a.magnitude).slice(0, count);
}

export function spectralCentroid(magnitudes: Float32Array, sampleRate: number, fftSize: number): number {
  let weighted = 0;
  let total = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    const freq = binToFrequency(i, sampleRate, fftSize);
    weighted += freq * magnitudes[i];
    total += magnitudes[i];
  }
  return total === 0 ? 0 : weighted / total;
}

export function spectralBandwidth(
  magnitudes: Float32Array,
  sampleRate: number,
  fftSize: number,
  centroid: number,
): number {
  let weighted = 0;
  let total = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    const freq = binToFrequency(i, sampleRate, fftSize);
    weighted += (freq - centroid) ** 2 * magnitudes[i];
    total += magnitudes[i];
  }
  return total === 0 ? 0 : Math.sqrt(weighted / total);
}

export function spectralRolloff(
  magnitudes: Float32Array,
  sampleRate: number,
  fftSize: number,
  threshold = 0.85,
): number {
  let total = 0;
  for (let i = 0; i < magnitudes.length; i++) total += magnitudes[i];
  if (total === 0) return 0;
  const target = total * threshold;
  let cumulative = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    cumulative += magnitudes[i];
    if (cumulative >= target) return binToFrequency(i, sampleRate, fftSize);
  }
  return binToFrequency(magnitudes.length - 1, sampleRate, fftSize);
}

export interface BandEnergy {
  label: string;
  lowHz: number;
  highHz: number;
  energy: number;
}

const BANDS: Array<{ label: string; lowHz: number; highHz: number }> = [
  { label: "Sub-bass", lowHz: 20, highHz: 60 },
  { label: "Bass", lowHz: 60, highHz: 250 },
  { label: "Low-mid", lowHz: 250, highHz: 500 },
  { label: "Mid", lowHz: 500, highHz: 2000 },
  { label: "High-mid", lowHz: 2000, highHz: 4000 },
  { label: "Presence", lowHz: 4000, highHz: 6000 },
  { label: "Brilliance", lowHz: 6000, highHz: 20000 },
];

export function bandEnergies(magnitudes: Float32Array, sampleRate: number, fftSize: number): BandEnergy[] {
  return BANDS.map((band) => {
    let energy = 0;
    for (let i = 0; i < magnitudes.length; i++) {
      const freq = binToFrequency(i, sampleRate, fftSize);
      if (freq >= band.lowHz && freq < band.highHz) energy += magnitudes[i] ** 2;
    }
    return { ...band, energy };
  });
}

/**
 * Autocorrelation-based fundamental frequency estimate (time-domain pitch
 * detection). Returns null when no strong periodicity is found.
 */
export function estimateFundamentalFrequency(
  samples: Float32Array,
  sampleRate: number,
  minHz = 60,
  maxHz = 1200,
): number | null {
  const maxLag = Math.floor(sampleRate / minHz);
  const minLag = Math.floor(sampleRate / maxHz);
  const n = samples.length;
  if (maxLag >= n) return null;

  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < n - lag; i++) corr += samples[i] * samples[i + lag];
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  let normEnergy = 0;
  for (let i = 0; i < n; i++) normEnergy += samples[i] * samples[i];
  if (bestLag < 0 || normEnergy === 0 || bestCorr / normEnergy < 0.35) return null;
  return sampleRate / bestLag;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function frequencyToNoteName(frequencyHz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(frequencyHz / 440));
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${name}${octave}`;
}
