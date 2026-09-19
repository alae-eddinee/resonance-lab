import { magnitudeSpectrum } from "../audio/fft";
import { applyWindow, windowCoefficients } from "../audio/windows";
import { findSpectralPeaks, type SpectralPeak } from "../audio/analysis";
import { computeModes } from "../physics/plateModes";
import { computeModeWeights, smoothWeights } from "./modalField";
import type { PlateConfig, PlateMode } from "../physics/types";

export interface RecordedFrame {
  timeS: number;
  /** modeId -> smoothed weight, only entries above the activity threshold */
  weights: Record<string, number>;
}

export interface RecordedRun {
  plateConfig: PlateConfig;
  modes: PlateMode[];
  frames: RecordedFrame[];
  durationS: number;
}

export interface OfflineProcessOptions {
  fftSize: number;
  hopSize: number;
  attack: number;
  release: number;
  responseMode: "scientific" | "demonstration";
  onProgress?: (fraction: number) => void;
}

const DEFAULT_OPTIONS: OfflineProcessOptions = {
  fftSize: 2048,
  hopSize: 512,
  attack: 0.35,
  release: 0.15,
  responseMode: "demonstration",
};

/**
 * Analyzes an entire audio buffer up front (not in real time) and produces a
 * frame-by-frame record of smoothed modal weights. Because this runs ahead of
 * playback rather than inside a real-time animation loop, it can afford full
 * resolution and a stable hop rate without dropping frames or visibly
 * glitching, at the cost of a short "processing" wait before playback starts.
 */
export async function processAudioForPlate(
  config: PlateConfig,
  samples: Float32Array,
  sampleRate: number,
  startS: number,
  endS: number,
  options: Partial<OfflineProcessOptions> = {},
): Promise<RecordedRun> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const modes = computeModes(config);
  const window = windowCoefficients("hann", opts.fftSize);

  const startSample = Math.max(0, Math.floor(startS * sampleRate));
  const endSample = Math.min(samples.length, Math.floor(endS * sampleRate));

  const frames: RecordedFrame[] = [];
  const weightMap = new Map<string, number>();

  const totalHops = Math.max(1, Math.floor((endSample - startSample - opts.fftSize) / opts.hopSize));
  let hopIndex = 0;

  for (let start = startSample; start + opts.fftSize <= endSample; start += opts.hopSize, hopIndex++) {
    const chunk = samples.subarray(start, start + opts.fftSize);
    const windowed = applyWindow(chunk as Float32Array, window);
    const mag = magnitudeSpectrum(windowed);
    const peaks: SpectralPeak[] = findSpectralPeaks(mag, sampleRate, opts.fftSize, { count: 6 });

    const target = computeModeWeights(config, modes, peaks, { mode: opts.responseMode });
    const smoothed = smoothWeights(weightMap, target, opts.attack, opts.release);
    weightMap.clear();
    for (const [id, w] of smoothed) weightMap.set(id, w);

    const weights: Record<string, number> = {};
    for (const [id, w] of weightMap) if (w > 0.02) weights[id] = w;

    frames.push({ timeS: (start - startSample) / sampleRate, weights });

    if (hopIndex % 40 === 0) {
      options.onProgress?.(Math.min(1, hopIndex / totalHops));
      // Yield to the main thread periodically so the UI (progress bar) can repaint.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  options.onProgress?.(1);
  return { plateConfig: config, modes, frames, durationS: (endSample - startSample) / sampleRate };
}

/** Finds the frame nearest to `timeS` (frames are in ascending time order). */
export function findFrameAt(run: RecordedRun, timeS: number): RecordedFrame | null {
  if (run.frames.length === 0) return null;
  let lo = 0;
  let hi = run.frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (run.frames[mid].timeS <= timeS) lo = mid;
    else hi = mid - 1;
  }
  return run.frames[lo];
}
