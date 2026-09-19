import { describe, expect, it } from "vitest";
import { rms, zeroCrossingRate, estimateFundamentalFrequency, frequencyToNoteName } from "@/lib/audio/analysis";
import { generateSineWave } from "@/lib/audio/signalGenerator";

describe("rms", () => {
  it("computes RMS of a full-scale sine as ~0.707", () => {
    const samples = generateSineWave({ frequencyHz: 440, durationS: 0.1, sampleRate: 44100, amplitude: 1 });
    expect(rms(samples)).toBeCloseTo(0.707, 1);
  });

  it("returns 0 for silence", () => {
    expect(rms(new Float32Array(100))).toBe(0);
  });
});

describe("zeroCrossingRate", () => {
  it("is higher for higher frequency tones", () => {
    const low = generateSineWave({ frequencyHz: 100, durationS: 0.1, sampleRate: 44100, amplitude: 1 });
    const high = generateSineWave({ frequencyHz: 2000, durationS: 0.1, sampleRate: 44100, amplitude: 1 });
    expect(zeroCrossingRate(high)).toBeGreaterThan(zeroCrossingRate(low));
  });
});

describe("estimateFundamentalFrequency", () => {
  it("recovers a 220 Hz tone via autocorrelation", () => {
    const samples = generateSineWave({ frequencyHz: 220, durationS: 0.2, sampleRate: 44100, amplitude: 1 });
    const f0 = estimateFundamentalFrequency(samples, 44100);
    expect(f0).not.toBeNull();
    expect(f0!).toBeGreaterThan(210);
    expect(f0!).toBeLessThan(230);
  });

  it("returns null for silence", () => {
    expect(estimateFundamentalFrequency(new Float32Array(4096), 44100)).toBeNull();
  });
});

describe("frequencyToNoteName", () => {
  it("maps 440 Hz to A4", () => {
    expect(frequencyToNoteName(440)).toBe("A4");
  });
});
