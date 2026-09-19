import { describe, expect, it } from "vitest";
import { magnitudeSpectrum, binToFrequency, isPowerOfTwo } from "@/lib/audio/fft";
import { windowCoefficients, applyWindow } from "@/lib/audio/windows";
import { findSpectralPeaks } from "@/lib/audio/analysis";

function generateSine(freq: number, sampleRate: number, n: number): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return out;
}

describe("fft", () => {
  it("detects a 440 Hz tone's dominant bin", () => {
    const sampleRate = 44100;
    const fftSize = 2048;
    const samples = generateSine(440, sampleRate, fftSize);
    const window = windowCoefficients("hann", fftSize);
    const windowed = applyWindow(samples, window);
    const mag = magnitudeSpectrum(windowed);
    const peaks = findSpectralPeaks(mag, sampleRate, fftSize, { count: 1 });
    expect(peaks.length).toBe(1);
    expect(peaks[0].frequencyHz).toBeGreaterThan(420);
    expect(peaks[0].frequencyHz).toBeLessThan(460);
  });

  it("rejects non-power-of-two sizes", () => {
    expect(isPowerOfTwo(1024)).toBe(true);
    expect(isPowerOfTwo(1000)).toBe(false);
  });

  it("converts bin index to frequency correctly", () => {
    expect(binToFrequency(10, 44100, 1024)).toBeCloseTo((10 * 44100) / 1024, 5);
  });
});
