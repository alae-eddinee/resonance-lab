"use client";

import { useEffect, useRef, useState } from "react";
import { renderDisplacementField, estimateSandDensity } from "@/lib/simulation/modalField";
import { findFrameAt, type RecordedRun } from "@/lib/simulation/offlineProcessor";

export interface RecordedPlaybackResult {
  displacementField: Float32Array | null;
  sandDensity: Float32Array | null;
  activeModeIds: string[];
}

/**
 * Renders the plate for whatever moment `getTimeS()` currently points to.
 * Because the modal weights were already computed offline, this only has to
 * do one cheap field render per animation frame -- smooth by construction,
 * regardless of how expensive the original analysis was.
 */
export function useRecordedPlayback(
  run: RecordedRun | null,
  getTimeS: () => number,
  playing: boolean,
): RecordedPlaybackResult {
  const [displacementField, setDisplacementField] = useState<Float32Array | null>(null);
  const [sandDensity, setSandDensity] = useState<Float32Array | null>(null);
  const [activeModeIds, setActiveModeIds] = useState<string[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!run || !playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const step = () => {
      const timeS = getTimeS();
      const frame = findFrameAt(run, timeS);
      if (frame) {
        const active = run.modes
          .filter((m) => frame.weights[m.id] !== undefined)
          .map((m) => ({ mode: m, weight: frame.weights[m.id] }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 8);
        const field = renderDisplacementField(run.plateConfig, active, run.plateConfig.simulationResolution);
        setDisplacementField(field);
        setSandDensity(estimateSandDensity(field));
        setActiveModeIds(active.map((a) => a.mode.id));
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [run, playing, getTimeS]);

  return { displacementField, sandDensity, activeModeIds };
}
