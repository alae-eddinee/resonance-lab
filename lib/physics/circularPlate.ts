import { besselJ, besselJZeros } from "./bessel";
import { flexuralRigidity } from "./materials";
import type { ModeShapeSampler, PlateConfig, PlateMode } from "./types";

/**
 * Circular plate approximation. Exact clamped/free circular-plate eigenvalues
 * require solving a transcendental equation mixing J_m and modified I_m; instead
 * this uses the flexural-wave dispersion relation f = (k^2 / 2*pi) * sqrt(D/(rho h))
 * with k taken from the radial zeros of J_m (a simply-supported-like idealization).
 * This is a documented approximation, not an exact boundary-value solution -- see
 * docs/methodology for limitations. Angular order m gives m nodal diameters,
 * radial index n gives n nodal circles, matching classical Chladni patterns.
 */
export function circularModes(config: PlateConfig): PlateMode[] {
  const { geometry, material, maxModeNumber } = config;
  const a = geometry.radiusM;
  const h = geometry.thicknessM;
  const rho = material.densityKgM3;
  const D = flexuralRigidity(material.youngsModulusGPa * 1e9, h, material.poissonRatio);
  const dispersion = Math.sqrt(D / (rho * h));

  const limitation =
    "Bessel-function approximation for an idealized circular plate; exact clamped/free boundary solution not solved.";

  const modes: PlateMode[] = [];
  for (let m = 0; m <= maxModeNumber; m++) {
    const zeros = besselJZeros(m, maxModeNumber);
    zeros.forEach((zero, idx) => {
      const n = idx + 1;
      const k = zero / a;
      const frequencyHz = (k ** 2 / (2 * Math.PI)) * dispersion;
      modes.push({ id: `c-${m}-${n}`, m, n, frequencyHz, limitation });
    });
  }
  return modes.sort((x, y) => x.frequencyHz - y.frequencyHz);
}

export function circularModeShape(mode: PlateMode, radiusM: number): ModeShapeSampler {
  const zeros = besselJZeros(mode.m, mode.n);
  const zero = zeros[mode.n - 1] ?? zeros[zeros.length - 1] ?? mode.n * Math.PI;
  const k = zero / radiusM;
  return (xNorm, yNorm) => {
    const dx = xNorm - 0.5;
    const dy = yNorm - 0.5;
    const r = Math.sqrt(dx * dx + dy * dy) * 2 * radiusM;
    if (r > radiusM) return 0;
    const theta = Math.atan2(dy, dx);
    return besselJ(mode.m, k * r) * Math.cos(mode.m * theta);
  };
}
