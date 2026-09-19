"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeModes } from "@/lib/physics/plateModes";
import { computeModeWeights, renderDisplacementField, estimateSandDensity, smoothWeights } from "@/lib/simulation/modalField";
import type { PlateConfig, PlateMode } from "@/lib/physics/types";
import type { SpectralPeak } from "@/lib/audio/analysis";

export interface PlateResponseResult {
  modes: PlateMode[];
  activeModeIds: string[];
  activeModeFrequencies: number[];
  displacementField: Float32Array | null;
  sandDensity: Float32Array | null;
}

/**
 * Continuously maps `getPeaks()` onto `config`'s plate modes with attack/release
 * smoothing, independent of how peaks are produced (tone, upload, or microphone).
 */
export function usePlateResponse(
  config: PlateConfig,
  getPeaks: () => SpectralPeak[],
  options: { active: boolean; attack?: number; release?: number; mode?: "scientific" | "demonstration"; updateRateHz?: number },
): PlateResponseResult {
  const { active, attack = 0.35, release = 0.12, mode = "scientific", updateRateHz = 24 } = options;
  const modes = useMemo(() => computeModes(config), [config]);
  const [displacementField, setDisplacementField] = useState<Float32Array | null>(null);
  const [sandDensity, setSandDensity] = useState<Float32Array | null>(null);
  const [activeModeIds, setActiveModeIds] = useState<string[]>([]);
  const [activeModeFrequencies, setActiveModeFrequencies] = useState<number[]>([]);

  const weightMapRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const getPeaksRef = useRef(getPeaks);

  useEffect(() => {
    getPeaksRef.current = getPeaks;
  }, [getPeaks]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      weightMapRef.current = new Map();
      // Synchronize output state with the source becoming inactive.
      /* eslint-disable react-hooks/set-state-in-effect */
      setDisplacementField(null);
      setSandDensity(null);
      setActiveModeIds([]);
      setActiveModeFrequencies([]);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    const tick = () => {
      const now = performance.now();
      if (now - lastRef.current >= 1000 / updateRateHz) {
        lastRef.current = now;
        const peaks = getPeaksRef.current();
        const target = computeModeWeights(config, modes, peaks, { mode });
        weightMapRef.current = smoothWeights(weightMapRef.current, target, attack, release);
        const activeWeights = modes
          .filter((m) => (weightMapRef.current.get(m.id) ?? 0) > 0.02)
          .map((m) => ({ mode: m, weight: weightMapRef.current.get(m.id)! }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 8);
        setActiveModeIds(activeWeights.map((a) => a.mode.id));
        setActiveModeFrequencies(activeWeights.map((a) => a.mode.frequencyHz));
        const field = renderDisplacementField(config, activeWeights, config.simulationResolution);
        setDisplacementField(field);
        setSandDensity(estimateSandDensity(field));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, config, modes, mode, attack, release, updateRateHz]);

  return { modes, activeModeIds, activeModeFrequencies, displacementField, sandDensity };
}
