"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { PLATE_PRESETS } from "@/lib/physics/presets";
import { computeModes } from "@/lib/physics/plateModes";
import { renderDisplacementField, estimateSandDensity } from "@/lib/simulation/modalField";
import { PlateViewport } from "./PlateViewport";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { Button } from "@/components/ui/Button";

export function DemoPlate() {
  const [running, setRunning] = useState(false);
  const [field, setField] = useState<Float32Array | null>(null);
  const [sand, setSand] = useState<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  const plate = useMemo(() => PLATE_PRESETS[0], []);
  const modes = useMemo(() => computeModes(plate), [plate]);
  const sampleModes = useMemo(() => [modes[1], modes[4], modes[7]].filter(Boolean), [modes]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const step = () => {
      tRef.current += 0.02;
      const weights = sampleModes.map((mode, i) => ({
        mode,
        weight: 0.5 + 0.5 * Math.sin(tRef.current * (0.6 + i * 0.3) + i),
      }));
      const displacement = renderDisplacementField(plate, weights, plate.simulationResolution);
      setField(displacement);
      setSand(estimateSandDensity(displacement));
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, plate, sampleModes]);

  return (
    <div className="w-full max-w-[640px]">
      <div className="mb-2 flex items-center gap-2">
        <EvidenceBadge category="educational-mapping" />
        <span className="text-xs text-[var(--color-text-muted)]">Sample audio driving a simulation</span>
      </div>
      <PlateViewport
        shape={plate.geometry.shape}
        resolution={plate.simulationResolution}
        displacementField={field}
        sandDensity={sand}
        view="particles"
        frozen={!running}
        running={running}
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">Paused example plate</p>
        <Button variant="secondary" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause preview" : "Play preview"}
        </Button>
      </div>
    </div>
  );
}
