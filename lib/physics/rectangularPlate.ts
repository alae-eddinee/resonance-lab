import type { ModeShapeSampler, PlateConfig, PlateMode } from "./types";
import { flexuralRigidity } from "./materials";

/**
 * Simply supported rectangular plate, classical thin-plate (Kirchhoff-Love) theory:
 *   f_mn = (pi / 2) * sqrt(D / (rho h)) * (m^2/a^2 + n^2/b^2)
 * Reference: Leissa, A.W. "Vibration of Plates", NASA SP-160 (1969), Ch. 4.
 */
export function rectangularModes(config: PlateConfig): PlateMode[] {
  const { geometry, material, boundary, maxModeNumber } = config;
  const a = geometry.widthM;
  const b = geometry.shape === "square" ? geometry.widthM : geometry.heightM;
  const h = geometry.thicknessM;
  const rho = material.densityKgM3;
  const D = flexuralRigidity(material.youngsModulusGPa * 1e9, h, material.poissonRatio);
  const factor = (Math.PI / 2) * Math.sqrt(D / (rho * h));

  const limitation =
    boundary === "simply-supported"
      ? "Exact for an idealized simply supported rectangular plate."
      : "Approximated with the simply supported rectangular solution; boundary condition is idealized.";

  const modes: PlateMode[] = [];
  for (let m = 1; m <= maxModeNumber; m++) {
    for (let n = 1; n <= maxModeNumber; n++) {
      const frequencyHz = factor * (m ** 2 / a ** 2 + n ** 2 / b ** 2);
      modes.push({ id: `r-${m}-${n}`, m, n, frequencyHz, limitation });
    }
  }
  return modes.sort((x, y) => x.frequencyHz - y.frequencyHz);
}

export function rectangularModeShape(mode: PlateMode): ModeShapeSampler {
  return (xNorm, yNorm) => Math.sin(mode.m * Math.PI * xNorm) * Math.sin(mode.n * Math.PI * yNorm);
}
