import { describe, expect, it } from "vitest";
import { rectangularModes } from "@/lib/physics/rectangularPlate";
import { circularModes } from "@/lib/physics/circularPlate";
import { findMaterial, flexuralRigidity } from "@/lib/physics/materials";
import type { PlateConfig } from "@/lib/physics/types";

const basePlate: PlateConfig = {
  id: "test",
  name: "Test plate",
  geometry: { shape: "square", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.001 },
  material: findMaterial("steel"),
  boundary: "simply-supported",
  mountPosition: { x: 0.5, y: 0.5 },
  exciterPosition: { x: 0.5, y: 0.5 },
  damping: 0.02,
  maxModeNumber: 4,
  simulationResolution: 32,
};

describe("flexuralRigidity", () => {
  it("increases with the cube of thickness", () => {
    const thin = flexuralRigidity(200e9, 0.001, 0.3);
    const thick = flexuralRigidity(200e9, 0.002, 0.3);
    expect(thick / thin).toBeCloseTo(8, 1);
  });
});

describe("rectangularModes", () => {
  it("produces increasing frequency with mode number", () => {
    const modes = rectangularModes(basePlate);
    expect(modes.length).toBe(16);
    for (let i = 1; i < modes.length; i++) {
      expect(modes[i].frequencyHz).toBeGreaterThanOrEqual(modes[i - 1].frequencyHz);
    }
  });

  it("raises resonant frequencies when thickness increases", () => {
    const thin = rectangularModes(basePlate)[0].frequencyHz;
    const thick = rectangularModes({
      ...basePlate,
      geometry: { ...basePlate.geometry, thicknessM: 0.003 },
    })[0].frequencyHz;
    expect(thick).toBeGreaterThan(thin);
  });

  it("lowers resonant frequencies as plate area grows", () => {
    const small = rectangularModes(basePlate)[0].frequencyHz;
    const large = rectangularModes({
      ...basePlate,
      geometry: { ...basePlate.geometry, widthM: 0.4, heightM: 0.4 },
    })[0].frequencyHz;
    expect(large).toBeLessThan(small);
  });
});

describe("circularModes", () => {
  it("produces positive, increasing frequencies", () => {
    const modes = circularModes({
      ...basePlate,
      geometry: { ...basePlate.geometry, shape: "circle", radiusM: 0.1 },
      maxModeNumber: 3,
    });
    expect(modes.length).toBeGreaterThan(0);
    for (const mode of modes) expect(mode.frequencyHz).toBeGreaterThan(0);
    for (let i = 1; i < modes.length; i++) {
      expect(modes[i].frequencyHz).toBeGreaterThanOrEqual(modes[i - 1].frequencyHz);
    }
  });
});
