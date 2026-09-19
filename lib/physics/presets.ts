import type { PlateConfig } from "./types";
import { findMaterial } from "./materials";

const basePlate = (overrides: Partial<PlateConfig> & { id: string; name: string }): PlateConfig => ({
  geometry: { shape: "square", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.001 },
  material: findMaterial("steel"),
  boundary: "simply-supported",
  mountPosition: { x: 0.5, y: 0.5 },
  exciterPosition: { x: 0.5, y: 0.5 },
  damping: 0.02,
  maxModeNumber: 6,
  simulationResolution: 64,
  ...overrides,
});

export const PLATE_PRESETS: PlateConfig[] = [
  basePlate({
    id: "thin-square-steel",
    name: "Thin square steel plate",
    geometry: { shape: "square", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.0008 },
  }),
  basePlate({
    id: "thick-square-steel",
    name: "Thick square steel plate",
    geometry: { shape: "square", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.003 },
  }),
  basePlate({
    id: "thin-circular-steel",
    name: "Thin circular steel plate",
    geometry: { shape: "circle", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.0008 },
  }),
  basePlate({
    id: "circular-aluminium",
    name: "Circular aluminium plate",
    geometry: { shape: "circle", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.0012 },
    material: findMaterial("aluminium"),
  }),
  basePlate({
    id: "rectangular-brass",
    name: "Rectangular brass plate",
    geometry: { shape: "rectangle", widthM: 0.24, heightM: 0.16, radiusM: 0.1, thicknessM: 0.0015 },
    material: findMaterial("brass"),
  }),
  basePlate({
    id: "custom-lab-plate",
    name: "Custom laboratory plate",
    geometry: { shape: "square", widthM: 0.2, heightM: 0.2, radiusM: 0.1, thicknessM: 0.0015 },
  }),
];
