import { describe, expect, it } from "vitest";
import { computeModeWeights, renderDisplacementField, smoothWeights } from "@/lib/simulation/modalField";
import { rectangularModes } from "@/lib/physics/rectangularPlate";
import { findMaterial } from "@/lib/physics/materials";
import type { PlateConfig } from "@/lib/physics/types";
import type { SpectralPeak } from "@/lib/audio/analysis";

const plate: PlateConfig = {
  id: "test",
  name: "Test plate",
  geometry: { shape: "square", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.001 },
  material: findMaterial("steel"),
  boundary: "simply-supported",
  mountPosition: { x: 0.5, y: 0.5 },
  exciterPosition: { x: 0.5, y: 0.5 },
  damping: 0.02,
  maxModeNumber: 4,
  simulationResolution: 24,
};

describe("computeModeWeights", () => {
  it("weights the closest mode highest for a matching peak", () => {
    const modes = rectangularModes(plate);
    const target = modes[3];
    const peaks: SpectralPeak[] = [{ bin: 0, frequencyHz: target.frequencyHz, magnitude: 1 }];
    const weights = computeModeWeights(plate, modes, peaks, { mode: "scientific" });
    expect(weights[0].mode.id).toBe(target.id);
  });

  it("produces no weights when there are no peaks", () => {
    const modes = rectangularModes(plate);
    expect(computeModeWeights(plate, modes, [], { mode: "scientific" })).toEqual([]);
  });

  it("activates a mode from realistically small raw FFT magnitudes", () => {
    // Regression test: raw FFT bin magnitudes for typical mic/voice input are
    // often 0.001-0.05, not order-1. Weights must be normalized against the
    // strongest detected peak so the plate still visibly responds, rather
    // than every contribution silently falling below the ~0.02 activity
    // threshold used to decide which modes are "active" everywhere else.
    const modes = rectangularModes(plate);
    const target = modes[0];
    const peaks: SpectralPeak[] = [{ bin: 0, frequencyHz: target.frequencyHz, magnitude: 0.015 }];
    const weights = computeModeWeights(plate, modes, peaks, { mode: "demonstration" });
    expect(weights[0].mode.id).toBe(target.id);
    expect(weights[0].weight).toBeGreaterThan(0.02);
  });

  describe("demonstration mode with off-resonance input (real music/voice)", () => {
    // Regression test for a bug found by tracing real numbers end to end: a
    // plate has only a sparse set of discrete resonances, while real audio's
    // pitch mostly falls between them. A fixed proximity-tolerance approach
    // can't win either way: narrow enough to tell different notes apart and
    // most audio produces zero active modes (looks "dead"/"disappeared");
    // wide enough to always respond and clearly different notes produce the
    // identical active-mode set (looks like it "ignores the sound"). Both
    // were reproduced and shipped at different tolerance values before this
    // test existed. Demonstration mode must always respond AND distinguish.
    const modes = rectangularModes({ ...plate, maxModeNumber: 6 });

    it("never produces an empty result for on-plate audio frequencies", () => {
      for (const freq of [110, 150, 200, 300, 500, 700, 900]) {
        const weights = computeModeWeights(
          plate,
          modes,
          [{ bin: 0, frequencyHz: freq, magnitude: 0.04 }],
          { mode: "demonstration" },
        );
        expect(weights.length, `expected a response for ${freq} Hz`).toBeGreaterThan(0);
      }
    });

    it("gives clearly different frequencies clearly different top modes", () => {
      const weightsFor = (freq: number) =>
        computeModeWeights(plate, modes, [{ bin: 0, frequencyHz: freq, magnitude: 0.04 }], {
          mode: "demonstration",
        });
      const low = weightsFor(150);
      const high = weightsFor(700);
      expect(low[0].mode.id).not.toBe(high[0].mode.id);
    });
  });
});

describe("renderDisplacementField", () => {
  it("returns a field normalized to [-1, 1]", () => {
    const modes = rectangularModes(plate);
    const weights = [{ mode: modes[0], weight: 1 }];
    const field = renderDisplacementField(plate, weights, 24);
    let maxAbs = 0;
    for (const v of field) maxAbs = Math.max(maxAbs, Math.abs(v));
    expect(maxAbs).toBeCloseTo(1, 5);
  });

  it("returns all zeros with no active modes", () => {
    const field = renderDisplacementField(plate, [], 16);
    expect(field.every((v) => v === 0)).toBe(true);
  });
});

describe("smoothWeights", () => {
  it("moves toward target using attack rate", () => {
    const modes = rectangularModes(plate);
    const prev = new Map([[modes[0].id, 0]]);
    const target = [{ mode: modes[0], weight: 1 }];
    const next = smoothWeights(prev, target, 0.5, 0.1);
    expect(next.get(modes[0].id)).toBeCloseTo(0.5, 5);
  });

  it("decays removed modes using release rate", () => {
    const modes = rectangularModes(plate);
    const prev = new Map([[modes[0].id, 1]]);
    const next = smoothWeights(prev, [], 0.5, 0.5);
    expect(next.get(modes[0].id)).toBeCloseTo(0.5, 5);
  });
});
