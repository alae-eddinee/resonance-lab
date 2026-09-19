"use client";

import { useCallback, useState } from "react";
import { processAudioForPlate, type RecordedRun } from "@/lib/simulation/offlineProcessor";
import type { PlateConfig } from "@/lib/physics/types";
import type { DecodedAudio } from "@/lib/audio/decode";

export type ProcessingStatus = "idle" | "processing" | "done" | "error";

export function useOfflineProcessing() {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [run, setRun] = useState<RecordedRun | null>(null);

  const process = useCallback(
    async (config: PlateConfig, audio: DecodedAudio, startS: number, endS: number) => {
      setStatus("processing");
      setProgress(0);
      setRun(null);
      try {
        const result = await processAudioForPlate(config, audio.samples, audio.sampleRate, startS, endS, {
          onProgress: setProgress,
        });
        setRun(result);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setRun(null);
  }, []);

  return { status, progress, run, process, reset };
}
