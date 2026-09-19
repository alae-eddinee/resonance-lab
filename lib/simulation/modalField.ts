import type { PlateConfig, PlateMode } from "../physics/types";
import { modeShapeSampler } from "../physics/plateModes";
import type { SpectralPeak } from "../audio/analysis";

export interface ModeWeight {
  mode: PlateMode;
  /** current smoothed contribution weight, 0-1+ */
  weight: number;
}

/**
 * Maps detected spectral peaks onto nearby plate modes. Weight combines
 * frequency proximity (Gaussian falloff in cents), peak magnitude, and an
 * excitation-position participation factor (modes with near-zero displacement
 * at the exciter position are only weakly driven, matching modal excitation
 * theory for point forcing).
 */
export function computeModeWeights(
  config: PlateConfig,
  modes: PlateMode[],
  peaks: SpectralPeak[],
  options: { toleranceCents?: number; mode: "scientific" | "demonstration" } = { mode: "scientific" },
): ModeWeight[] {
  const toleranceCents = options.toleranceCents ?? (options.mode === "demonstration" ? 900 : 150);
  const weights = new Map<string, number>();

  // Raw FFT bin magnitudes are typically tiny (often 0.001-0.05 for normal
  // mic/voice levels) and vary with mic gain, FFT size, and windowing. Using
  // them directly against an absolute activity threshold meant most real
  // input never crossed it. Normalizing against the loudest detected peak
  // makes response robust to input level: the dominant peak always
  // contributes at full relative strength.
  const maxMagnitude = peaks.reduce((max, p) => Math.max(max, p.magnitude), 0);
  if (maxMagnitude <= 0) return [];

  for (const peak of peaks) {
    const relativeMagnitude = peak.magnitude / maxMagnitude;
    for (const mode of modes) {
      if (mode.frequencyHz <= 0) continue;
      const cents = 1200 * Math.log2(peak.frequencyHz / mode.frequencyHz);
      const proximity = Math.exp(-((cents / toleranceCents) ** 2));
      if (proximity < 0.02) continue;

      const sampler = modeShapeSampler(config, mode);
      const participation = Math.abs(sampler(config.exciterPosition.x, config.exciterPosition.y));

      const contribution = proximity * relativeMagnitude * (0.35 + 0.65 * participation);
      weights.set(mode.id, (weights.get(mode.id) ?? 0) + contribution);
    }
  }

  return modes
    .filter((mode) => weights.has(mode.id))
    .map((mode) => ({ mode, weight: weights.get(mode.id)! }))
    .sort((a, b) => b.weight - a.weight);
}

/** Exponential attack/release smoothing toward target weights, in place on a Map. */
export function smoothWeights(
  previous: Map<string, number>,
  target: ModeWeight[],
  attack: number,
  release: number,
): Map<string, number> {
  const next = new Map<string, number>();
  const targetMap = new Map(target.map((t) => [t.mode.id, t.weight]));
  const ids = new Set([...previous.keys(), ...targetMap.keys()]);
  for (const id of ids) {
    const prev = previous.get(id) ?? 0;
    const goal = targetMap.get(id) ?? 0;
    const rate = goal > prev ? attack : release;
    const value = prev + (goal - prev) * rate;
    if (value > 1e-4) next.set(id, value);
  }
  return next;
}

/**
 * Renders a normalized displacement grid (resolution x resolution, values in
 * [-1, 1]) by superposing weighted mode shapes.
 */
export function renderDisplacementField(
  config: PlateConfig,
  activeWeights: Array<{ mode: PlateMode; weight: number }>,
  resolution = config.simulationResolution,
): Float32Array {
  const grid = new Float32Array(resolution * resolution);
  if (activeWeights.length === 0) return grid;

  const samplers = activeWeights.map(({ mode, weight }) => ({ sampler: modeShapeSampler(config, mode), weight }));

  let maxAbs = 0;
  for (let yi = 0; yi < resolution; yi++) {
    const yNorm = (yi + 0.5) / resolution;
    for (let xi = 0; xi < resolution; xi++) {
      const xNorm = (xi + 0.5) / resolution;
      if (config.geometry.shape === "circle") {
        const dx = xNorm - 0.5;
        const dy = yNorm - 0.5;
        if (dx * dx + dy * dy > 0.25) continue;
      }
      let value = 0;
      for (const { sampler, weight } of samplers) value += sampler(xNorm, yNorm) * weight;
      grid[yi * resolution + xi] = value;
      maxAbs = Math.max(maxAbs, Math.abs(value));
    }
  }

  if (maxAbs > 1e-6) {
    for (let i = 0; i < grid.length; i++) grid[i] /= maxAbs;
  }
  return grid;
}

/**
 * Estimated sand-accumulation density: sand collects at low-displacement
 * (near-nodal) regions. This derives directly from the displacement field,
 * never from random geometry.
 */
export function estimateSandDensity(displacementField: Float32Array, sharpness = 6): Float32Array {
  const density = new Float32Array(displacementField.length);
  for (let i = 0; i < displacementField.length; i++) {
    density[i] = Math.exp(-sharpness * displacementField[i] ** 2);
  }
  return density;
}
