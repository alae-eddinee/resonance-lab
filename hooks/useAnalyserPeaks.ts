"use client";

import { useEffect, useRef, useState } from "react";
import { magnitudeSpectrum } from "@/lib/audio/fft";
import { applyWindow, windowCoefficients } from "@/lib/audio/windows";
import { findSpectralPeaks, rms, type SpectralPeak } from "@/lib/audio/analysis";

export interface AnalyserPeaksResult {
  waveform: Float32Array | null;
  magnitudes: Float32Array | null;
  peaks: SpectralPeak[];
  rmsLevel: number;
  getPeaksSnapshot: () => SpectralPeak[];
}

export function useAnalyserPeaks(
  analyser: AnalyserNode | null,
  sampleRate: number,
  options: { peakCount?: number; noiseFloor?: number; minFrequencyHz?: number; maxFrequencyHz?: number; updateRateHz?: number } = {},
): AnalyserPeaksResult {
  const { peakCount = 5, noiseFloor = 0.005, minFrequencyHz = 20, maxFrequencyHz = 4000, updateRateHz = 24 } = options;
  const [waveform, setWaveform] = useState<Float32Array | null>(null);
  const [magnitudes, setMagnitudes] = useState<Float32Array | null>(null);
  const [peaks, setPeaks] = useState<SpectralPeak[]>([]);
  const [rmsLevel, setRmsLevel] = useState(0);
  const peaksRef = useRef<SpectralPeak[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    if (!analyser) {
      // Synchronize UI state with the external AnalyserNode's teardown.
      /* eslint-disable react-hooks/set-state-in-effect */
      setWaveform(null);
      setMagnitudes(null);
      setPeaks([]);
      /* eslint-enable react-hooks/set-state-in-effect */
      peaksRef.current = [];
      return;
    }

    const tick = () => {
      const now = performance.now();
      if (now - lastRef.current >= 1000 / updateRateHz) {
        lastRef.current = now;
        const timeDomain = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(timeDomain);
        const window = windowCoefficients("hann", timeDomain.length);
        const windowed = applyWindow(timeDomain, window);
        const mag = magnitudeSpectrum(windowed);
        const detected = findSpectralPeaks(mag, sampleRate, timeDomain.length, {
          count: peakCount,
          noiseFloor,
          minFrequencyHz,
          maxFrequencyHz,
        });
        peaksRef.current = detected;
        setWaveform(timeDomain);
        setMagnitudes(mag);
        setPeaks(detected);
        setRmsLevel(rms(timeDomain));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, sampleRate, peakCount, noiseFloor, minFrequencyHz, maxFrequencyHz, updateRateHz]);

  return { waveform, magnitudes, peaks, rmsLevel, getPeaksSnapshot: () => peaksRef.current };
}
