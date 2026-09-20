import type { PlateConfig, PlateMode } from "../physics/types";
import { modeShapeSampler } from "../physics/plateModes";
import type { SpectralPeak } from "../audio/analysis";

export interface ModeWeight {
  mode: PlateMode;
  /** current smoothed contribution weight, 0-1+ */
  weight: number;
}

function participationOf(config: PlateConfig, mode: PlateMode): number {
  const sampler = modeShapeSampler(config, mode);
  return Math.abs(sampler(config.exciterPosition.x, config.exciterPosition.y));
}

/**
 * Maps detected spectral peaks onto plate modes.
 *
 * "Scientific" uses a strict Gaussian falloff around each mode's true
 * resonance: it can legitimately show nothing when no real resonance is
 * excited, which is the scientifically honest behavior for that mode.
 *
 * "Demonstration" uses a different strategy: a plate has only a sparse set
 * of discrete resonances (tens of Hz apart), while real audio (voice, music)
 * has continuous pitch content that mostly falls *between* them. A fixed
 * proximity radius can never work well for that: narrow enough to
 * distinguish different notes and most audio produces no response at all
 * (measured: a 150-cent radius left ~every frame of a 150 Hz tone with zero
 * active modes on a typical steel-plate preset); wide enough to always
 * respond and distinct notes stop being distinguishable (measured: 300 Hz
 * and 500 Hz tones -- clearly different pitches -- produced the identical
 * top-5 active-mode set at a 900-cent radius). So instead, demonstration
 * mode always blends between the two nearest resonances in log-frequency
 * (musical) space, in proportion to how close the peak is to each. This
 * guarantees the plate is always driven by whatever is actually playing
 * (never silent while there is a detected peak), and which modes light up
 * tracks the input frequency continuously rather than snapping between a
 * fixed set.
 */
export function computeModeWeights(
  config: PlateConfig,
  modes: PlateMode[],
  peaks: SpectralPeak[],
  options: { toleranceCents?: number; mode: "scientific" | "demonstration" } = { mode: "scientific" },
): ModeWeight[] {
  const weights = new Map<string, number>();

  // Raw FFT bin magnitudes are typically tiny (often 0.001-0.05 for normal
  // mic/voice levels) and vary with mic gain, FFT size, and windowing. Using
  // them directly against an absolute activity threshold meant most real
  // input never crossed it. Normalizing against the loudest detected peak
  // makes response robust to input level: the dominant peak always
  // contributes at full relative strength.
  const maxMagnitude = peaks.reduce((max, p) => Math.max(max, p.magnitude), 0);
  if (maxMagnitude <= 0 || modes.length === 0) return [];

  if (options.mode === "demonstration") {
    const sortedFreqs = [...new Set(modes.map((m) => m.frequencyHz))].sort((a, b) => a - b);

    for (const peak of peaks) {
      if (peak.frequencyHz <= 0) continue;
      const relativeMagnitude = peak.magnitude / maxMagnitude;

      let lowerFreq = sortedFreqs[0];
      let upperFreq = sortedFreqs[sortedFreqs.length - 1];
      if (peak.frequencyHz <= sortedFreqs[0]) {
        upperFreq = lowerFreq;
      } else if (peak.frequencyHz >= sortedFreqs[sortedFreqs.length - 1]) {
        lowerFreq = upperFreq;
      } else {
        for (let i = 0; i < sortedFreqs.length - 1; i++) {
          if (sortedFreqs[i] <= peak.frequencyHz && peak.frequencyHz <= sortedFreqs[i + 1]) {
            lowerFreq = sortedFreqs[i];
            upperFreq = sortedFreqs[i + 1];
            break;
          }
        }
      }

      const t =
        upperFreq === lowerFreq
          ? 0
          : (Math.log2(peak.frequencyHz) - Math.log2(lowerFreq)) / (Math.log2(upperFreq) - Math.log2(lowerFreq));

      const lowerModes = modes.filter((m) => m.frequencyHz === lowerFreq);
      for (const mode of lowerModes) {
        const share = ((1 - t) * relativeMagnitude) / lowerModes.length;
        const contribution = share * (0.35 + 0.65 * participationOf(config, mode));
        weights.set(mode.id, (weights.get(mode.id) ?? 0) + contribution);
      }

      if (upperFreq !== lowerFreq) {
        const upperModes = modes.filter((m) => m.frequencyHz === upperFreq);
        for (const mode of upperModes) {
          const share = (t * relativeMagnitude) / upperModes.length;
          const contribution = share * (0.35 + 0.65 * participationOf(config, mode));
          weights.set(mode.id, (weights.get(mode.id) ?? 0) + contribution);
        }
      }
    }
  } else {
    const toleranceCents = options.toleranceCents ?? 80;
    for (const peak of peaks) {
      const relativeMagnitude = peak.magnitude / maxMagnitude;
      for (const mode of modes) {
        if (mode.frequencyHz <= 0) continue;
        const cents = 1200 * Math.log2(peak.frequencyHz / mode.frequencyHz);
        const proximity = Math.exp(-((cents / toleranceCents) ** 2));
        if (proximity < 0.05) continue;
        const contribution = proximity * relativeMagnitude * (0.35 + 0.65 * participationOf(config, mode));
        weights.set(mode.id, (weights.get(mode.id) ?? 0) + contribution);
      }
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
