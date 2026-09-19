import type { MaterialProperties } from "./types";

export const MATERIAL_PRESETS: MaterialProperties[] = [
  { id: "steel", name: "Steel", densityKgM3: 7850, youngsModulusGPa: 200, poissonRatio: 0.30 },
  { id: "stainless-steel", name: "Stainless steel", densityKgM3: 8000, youngsModulusGPa: 193, poissonRatio: 0.29 },
  { id: "aluminium", name: "Aluminium", densityKgM3: 2700, youngsModulusGPa: 69, poissonRatio: 0.33 },
  { id: "brass", name: "Brass", densityKgM3: 8500, youngsModulusGPa: 100, poissonRatio: 0.34 },
  { id: "copper", name: "Copper", densityKgM3: 8960, youngsModulusGPa: 117, poissonRatio: 0.34 },
];

export const CUSTOM_MATERIAL: MaterialProperties = {
  id: "custom",
  name: "Custom",
  densityKgM3: 7850,
  youngsModulusGPa: 200,
  poissonRatio: 0.30,
};

export function findMaterial(id: string): MaterialProperties {
  return MATERIAL_PRESETS.find((m) => m.id === id) ?? CUSTOM_MATERIAL;
}

/** Flexural rigidity D = E h^3 / (12 (1 - v^2)), SI units (Pa * m^4 -> N*m) */
export function flexuralRigidity(youngsModulusPa: number, thicknessM: number, poissonRatio: number): number {
  return (youngsModulusPa * thicknessM ** 3) / (12 * (1 - poissonRatio ** 2));
}
