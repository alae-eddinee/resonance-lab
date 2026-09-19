import type { ModeShapeSampler, PlateConfig, PlateMode } from "./types";
import { rectangularModeShape, rectangularModes } from "./rectangularPlate";
import { circularModeShape, circularModes } from "./circularPlate";

export function computeModes(config: PlateConfig): PlateMode[] {
  return config.geometry.shape === "circle" ? circularModes(config) : rectangularModes(config);
}

export function modeShapeSampler(config: PlateConfig, mode: PlateMode): ModeShapeSampler {
  return config.geometry.shape === "circle"
    ? circularModeShape(mode, config.geometry.radiusM)
    : rectangularModeShape(mode);
}
