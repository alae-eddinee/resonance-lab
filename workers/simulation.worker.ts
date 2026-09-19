import { computeModes } from "../lib/physics/plateModes";
import { computeModeWeights, renderDisplacementField, estimateSandDensity } from "../lib/simulation/modalField";
import type { PlateConfig } from "../lib/physics/types";
import type { SpectralPeak } from "../lib/audio/analysis";

export interface SimulationRequest {
  requestId: number;
  config: PlateConfig;
  peaks: SpectralPeak[];
  responseMode: "scientific" | "demonstration";
}

export interface SimulationResponse {
  requestId: number;
  modeIds: string[];
  modeFrequencies: number[];
  weights: number[];
  displacementField: Float32Array;
  sandDensity: Float32Array;
  resolution: number;
}

self.onmessage = (event: MessageEvent<SimulationRequest>) => {
  const { requestId, config, peaks, responseMode } = event.data;
  const modes = computeModes(config);
  const activeWeights = computeModeWeights(config, modes, peaks, { mode: responseMode });
  const top = activeWeights.slice(0, 8);
  const displacementField = renderDisplacementField(config, top, config.simulationResolution);
  const sandDensity = estimateSandDensity(displacementField);

  const response: SimulationResponse = {
    requestId,
    modeIds: top.map((t) => t.mode.id),
    modeFrequencies: top.map((t) => t.mode.frequencyHz),
    weights: top.map((t) => t.weight),
    displacementField,
    sandDensity,
    resolution: config.simulationResolution,
  };

  (self as unknown as Worker).postMessage(response, [displacementField.buffer, sandDensity.buffer]);
};
