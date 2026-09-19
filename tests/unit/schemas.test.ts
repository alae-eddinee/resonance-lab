import { describe, expect, it } from "vitest";
import { validateExperimentRecord } from "@/lib/validation/schemas";
import { findMaterial } from "@/lib/physics/materials";

function baseRecord() {
  return {
    id: "exp-1",
    schemaVersion: 1 as const,
    appVersion: "0.1.0",
    title: "Test experiment",
    tags: [],
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceType: "generator" as const,
    evidenceCategories: ["physics-simulation" as const],
    activeModeIds: [],
    measurements: {},
    hasRetainedMedia: false,
  };
}

describe("validateExperimentRecord", () => {
  it("accepts a minimal valid record", () => {
    const result = validateExperimentRecord(baseRecord());
    expect(result.success).toBe(true);
  });

  it("rejects a record missing a title", () => {
    const record = { ...baseRecord(), title: "" };
    const result = validateExperimentRecord(record);
    expect(result.success).toBe(false);
  });

  it("accepts a record with a full plate configuration", () => {
    const record = {
      ...baseRecord(),
      plateConfig: {
        id: "plate-1",
        name: "Plate",
        geometry: { shape: "square" as const, widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.001 },
        material: findMaterial("steel"),
        boundary: "simply-supported" as const,
        mountPosition: { x: 0.5, y: 0.5 },
        exciterPosition: { x: 0.5, y: 0.5 },
        damping: 0.02,
        maxModeNumber: 6,
        simulationResolution: 64,
      },
    };
    const result = validateExperimentRecord(record);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid plate shape", () => {
    const record = {
      ...baseRecord(),
      plateConfig: {
        id: "plate-1",
        name: "Plate",
        geometry: { shape: "triangle", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.001 },
        material: findMaterial("steel"),
        boundary: "simply-supported",
        mountPosition: { x: 0.5, y: 0.5 },
        exciterPosition: { x: 0.5, y: 0.5 },
        damping: 0.02,
        maxModeNumber: 6,
        simulationResolution: 64,
      },
    };
    const result = validateExperimentRecord(record);
    expect(result.success).toBe(false);
  });
});
