import type { ExperimentRecordInput } from "../validation/schemas";

export type ExperimentRecord = ExperimentRecordInput;

export interface StoredMediaBlob {
  id: string;
  experimentId: string;
  kind: "audio" | "image" | "video";
  blob: Blob;
}

export interface PlatePresetRecord {
  id: string;
  name: string;
  config: ExperimentRecord["plateConfig"];
  createdAt: string;
  updatedAt: string;
}
