import { describe, expect, it } from "vitest";
import { generateSineWave, generateSweep, generateWhiteNoise, encodeWav } from "@/lib/audio/signalGenerator";

describe("generateSineWave", () => {
  it("produces the correct sample count", () => {
    const samples = generateSineWave({ frequencyHz: 440, durationS: 1, sampleRate: 48000, amplitude: 1 });
    expect(samples.length).toBe(48000);
  });

  it("stays within amplitude bounds", () => {
    const samples = generateSineWave({ frequencyHz: 440, durationS: 0.5, sampleRate: 44100, amplitude: 0.5 });
    for (const s of samples) expect(Math.abs(s)).toBeLessThanOrEqual(0.5001);
  });
});

describe("generateSweep", () => {
  it("produces samples for the requested duration", () => {
    const samples = generateSweep(100, 1000, 0.5, 44100, 0.5, "linear");
    expect(samples.length).toBe(Math.floor(0.5 * 44100));
  });
});

describe("generateWhiteNoise", () => {
  it("varies sample to sample", () => {
    const samples = generateWhiteNoise(0.1, 44100, 0.5);
    const unique = new Set(samples.subarray(0, 50));
    expect(unique.size).toBeGreaterThan(10);
  });
});

describe("encodeWav", () => {
  it("produces a WAV blob with a valid header size", async () => {
    const samples = generateSineWave({ frequencyHz: 440, durationS: 0.01, sampleRate: 44100, amplitude: 1 });
    const blob = encodeWav(samples, 44100);
    expect(blob.size).toBe(44 + samples.length * 2);
    expect(blob.type).toBe("audio/wav");
  });
});
