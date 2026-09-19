export type PlateShape = "square" | "rectangle" | "circle";

export type BoundaryCondition = "simply-supported" | "clamped" | "free";

export interface MaterialProperties {
  id: string;
  name: string;
  densityKgM3: number;
  youngsModulusGPa: number;
  poissonRatio: number;
}

export interface PlateGeometry {
  shape: PlateShape;
  /** metres */
  widthM: number;
  /** metres; equals widthM for square */
  heightM: number;
  /** metres; used when shape is "circle" */
  radiusM: number;
  /** metres */
  thicknessM: number;
}

export interface PlateConfig {
  id: string;
  name: string;
  geometry: PlateGeometry;
  material: MaterialProperties;
  boundary: BoundaryCondition;
  /** normalized 0-1, top-left origin */
  mountPosition: { x: number; y: number };
  /** normalized 0-1, top-left origin */
  exciterPosition: { x: number; y: number };
  /** modal damping ratio, dimensionless */
  damping: number;
  maxModeNumber: number;
  simulationResolution: number;
}

export interface PlateMode {
  id: string;
  m: number;
  n: number;
  /** Hz */
  frequencyHz: number;
  /** model limitation / approximation label */
  limitation: string;
}

export interface ModeShapeSampler {
  /** returns normalized displacement in [-1, 1] at normalized plate coordinates */
  (xNorm: number, yNorm: number): number;
}
