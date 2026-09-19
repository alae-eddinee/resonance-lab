import { z } from "zod";

export const materialSchema = z.object({
  id: z.string(),
  name: z.string(),
  densityKgM3: z.number().positive(),
  youngsModulusGPa: z.number().positive(),
  poissonRatio: z.number().min(0).max(0.5),
});

export const plateGeometrySchema = z.object({
  shape: z.enum(["square", "rectangle", "circle"]),
  widthM: z.number().positive(),
  heightM: z.number().positive(),
  radiusM: z.number().positive(),
  thicknessM: z.number().positive(),
});

export const plateConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(120),
  geometry: plateGeometrySchema,
  material: materialSchema,
  boundary: z.enum(["simply-supported", "clamped", "free"]),
  mountPosition: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  exciterPosition: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  damping: z.number().min(0).max(1),
  maxModeNumber: z.number().int().min(1).max(20),
  simulationResolution: z.number().int().min(16).max(256),
});

export const evidenceCategorySchema = z.enum([
  "measured-audio",
  "physics-simulation",
  "educational-mapping",
  "footage-measurement",
]);

export const experimentRecordSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  appVersion: z.string(),
  title: z.string().min(1).max(120),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(4000).default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceType: z.enum(["microphone", "upload", "generator", "physical-footage"]),
  evidenceCategories: z.array(evidenceCategorySchema),
  audioMeta: z
    .object({
      durationS: z.number().nonnegative(),
      sampleRate: z.number().positive(),
      channels: z.number().int().positive(),
      fileName: z.string().optional(),
    })
    .optional(),
  plateConfig: plateConfigSchema.optional(),
  activeModeIds: z.array(z.string()).default([]),
  measurements: z.record(z.string(), z.number()).default({}),
  hasRetainedMedia: z.boolean().default(false),
  thumbnailDataUrl: z.string().optional(),
});

export type ExperimentRecordInput = z.infer<typeof experimentRecordSchema>;

export function validateExperimentRecord(data: unknown) {
  return experimentRecordSchema.safeParse(data);
}
