"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startMicrophone, stopMicrophone, setMicrophoneMonitoring, type MicrophoneSession } from "@/lib/audio/microphone";
import { magnitudeSpectrum } from "@/lib/audio/fft";
import { applyWindow, windowCoefficients } from "@/lib/audio/windows";
import {
  amplitudeToDbfs,
  findSpectralPeaks,
  rms,
  spectralCentroid,
  estimateFundamentalFrequency,
  type SpectralPeak,
} from "@/lib/audio/analysis";
import { computeModes } from "@/lib/physics/plateModes";
import { computeModeWeights, renderDisplacementField, estimateSandDensity, smoothWeights } from "@/lib/simulation/modalField";
import type { PlateConfig, PlateMode } from "@/lib/physics/types";

export type MicPermissionState = "idle" | "pending" | "active" | "denied" | "error";

export interface LiveCymaticsSettings {
  fftSize: number;
  sensitivity: number;
  smoothing: number;
  noiseGate: number;
  minFrequencyHz: number;
  maxFrequencyHz: number;
  peakCount: number;
  attack: number;
  release: number;
  updateRateHz: number;
  responseMode: "scientific" | "demonstration";
}

export const DEFAULT_LIVE_SETTINGS: LiveCymaticsSettings = {
  fftSize: 2048,
  sensitivity: 1,
  smoothing: 0.6,
  noiseGate: 0.01,
  minFrequencyHz: 20,
  maxFrequencyHz: 4000,
  peakCount: 5,
  attack: 0.4,
  release: 0.12,
  updateRateHz: 24,
  responseMode: "demonstration",
};

export interface LiveCymaticsResult {
  status: MicPermissionState;
  deviceLabel: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  frozen: boolean;
  setFrozen: (v: boolean) => void;
  rmsDbfs: number;
  clipping: boolean;
  dominantFrequencyHz: number | null;
  fundamentalHz: number | null;
  spectralCentroidHz: number;
  peaks: SpectralPeak[];
  waveform: Float32Array | null;
  magnitudes: Float32Array | null;
  modes: PlateMode[];
  activeModeIds: string[];
  activeModeFrequencies: number[];
  displacementField: Float32Array | null;
  sandDensity: Float32Array | null;
  monitoring: boolean;
  setMonitoring: (v: boolean) => void;
  monitorVolume: number;
  setMonitorVolume: (v: number) => void;
  getMediaStream: () => MediaStream | null;
}

export function useLiveCymatics(config: PlateConfig, settings: LiveCymaticsSettings): LiveCymaticsResult {
  const [status, setStatus] = useState<MicPermissionState>("idle");
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [monitoring, setMonitoringState] = useState(false);
  const [monitorVolume, setMonitorVolumeState] = useState(0.6);

  const [rmsDbfs, setRmsDbfs] = useState(-Infinity);
  const [clipping, setClipping] = useState(false);
  const [dominantFrequencyHz, setDominantFrequencyHz] = useState<number | null>(null);
  const [fundamentalHz, setFundamentalHz] = useState<number | null>(null);
  const [spectralCentroidHz, setSpectralCentroidHz] = useState(0);
  const [peaks, setPeaks] = useState<SpectralPeak[]>([]);
  const [waveform, setWaveform] = useState<Float32Array | null>(null);
  const [magnitudes, setMagnitudes] = useState<Float32Array | null>(null);
  const [activeModeIds, setActiveModeIds] = useState<string[]>([]);
  const [activeModeFrequencies, setActiveModeFrequencies] = useState<number[]>([]);
  const [displacementField, setDisplacementField] = useState<Float32Array | null>(null);
  const [sandDensity, setSandDensity] = useState<Float32Array | null>(null);

  const sessionRef = useRef<MicrophoneSession | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const weightMapRef = useRef<Map<string, number>>(new Map());
  const settingsRef = useRef(settings);
  const frozenRef = useRef(frozen);
  const modes = useMemo(() => computeModes(config), [config]);
  const modesRef = useRef(modes);
  const configRef = useRef(config);

  useEffect(() => {
    settingsRef.current = settings;
    frozenRef.current = frozen;
    modesRef.current = modes;
    configRef.current = config;
  }, [settings, frozen, modes, config]);

  const tick = useCallback(function tick() {
    const session = sessionRef.current;
    if (!session) return;
    const s = settingsRef.current;
    const now = performance.now();
    const minInterval = 1000 / s.updateRateHz;

    if (!frozenRef.current && now - lastUpdateRef.current >= minInterval) {
      lastUpdateRef.current = now;
      const { analyser, audioContext } = session;
      const timeDomain = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(timeDomain);

      const gained = new Float32Array(timeDomain.length);
      for (let i = 0; i < timeDomain.length; i++) gained[i] = timeDomain[i] * s.sensitivity;

      const level = rms(gained);
      const dbfs = amplitudeToDbfs(level);
      setRmsDbfs(dbfs);
      setClipping(level > 0.98);
      setWaveform(gained);

      if (level >= s.noiseGate) {
        const window = windowCoefficients("hann", gained.length);
        const windowed = applyWindow(gained, window);
        const mag = magnitudeSpectrum(windowed);
        setMagnitudes(mag);

        const sampleRate = audioContext.sampleRate;
        const detectedPeaks = findSpectralPeaks(mag, sampleRate, gained.length, {
          count: s.peakCount,
          noiseFloor: s.noiseGate * 0.05,
          minFrequencyHz: s.minFrequencyHz,
          maxFrequencyHz: s.maxFrequencyHz,
        });
        setPeaks(detectedPeaks);
        setDominantFrequencyHz(detectedPeaks[0]?.frequencyHz ?? null);
        setSpectralCentroidHz(spectralCentroid(mag, sampleRate, gained.length));
        setFundamentalHz(estimateFundamentalFrequency(gained, sampleRate));

        const targetWeights = computeModeWeights(configRef.current, modesRef.current, detectedPeaks, {
          mode: s.responseMode,
        });
        weightMapRef.current = smoothWeights(weightMapRef.current, targetWeights, s.attack, s.release);

        const active = modesRef.current
          .filter((m) => (weightMapRef.current.get(m.id) ?? 0) > 0.02)
          .map((m) => ({ mode: m, weight: weightMapRef.current.get(m.id)! }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 8);

        setActiveModeIds(active.map((a) => a.mode.id));
        setActiveModeFrequencies(active.map((a) => a.mode.frequencyHz));

        const field = renderDisplacementField(configRef.current, active, configRef.current.simulationResolution);
        setDisplacementField(field);
        setSandDensity(estimateSandDensity(field));
      } else {
        setPeaks([]);
        setDominantFrequencyHz(null);
        setFundamentalHz(null);

        weightMapRef.current = smoothWeights(weightMapRef.current, [], s.attack, s.release);
        const active = modesRef.current
          .filter((m) => (weightMapRef.current.get(m.id) ?? 0) > 0.02)
          .map((m) => ({ mode: m, weight: weightMapRef.current.get(m.id)! }));
        const field = renderDisplacementField(configRef.current, active, configRef.current.simulationResolution);
        setDisplacementField(field);
        setSandDensity(estimateSandDensity(field));
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setStatus("pending");
    try {
      const session = await startMicrophone(settingsRef.current.fftSize);
      sessionRef.current = session;
      const track = session.stream.getAudioTracks()[0];
      setDeviceLabel(track?.label || "Default microphone");
      setStatus("active");
      lastUpdateRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setStatus("denied");
    }
  }, [tick]);

  const stop = useCallback(async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (sessionRef.current) {
      await stopMicrophone(sessionRef.current);
      sessionRef.current = null;
    }
    setStatus("idle");
    setDeviceLabel(null);
    setWaveform(null);
    setMagnitudes(null);
    setPeaks([]);
    setDominantFrequencyHz(null);
    setFundamentalHz(null);
    setActiveModeIds([]);
    setActiveModeFrequencies([]);
    setDisplacementField(null);
    setSandDensity(null);
    setMonitoringState(false);
    weightMapRef.current = new Map();
  }, []);

  const setMonitoring = useCallback((enabled: boolean) => {
    setMonitoringState(enabled);
    if (sessionRef.current) setMicrophoneMonitoring(sessionRef.current, enabled, monitorVolume);
  }, [monitorVolume]);

  const setMonitorVolume = useCallback((volume: number) => {
    setMonitorVolumeState(volume);
    if (sessionRef.current) setMicrophoneMonitoring(sessionRef.current, monitoring, volume);
  }, [monitoring]);

  const getMediaStream = useCallback(() => sessionRef.current?.stream ?? null, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (sessionRef.current) void stopMicrophone(sessionRef.current);
    };
  }, []);

  return {
    status,
    deviceLabel,
    start,
    stop,
    frozen,
    setFrozen,
    rmsDbfs,
    clipping,
    dominantFrequencyHz,
    fundamentalHz,
    spectralCentroidHz,
    peaks,
    waveform,
    magnitudes,
    modes,
    activeModeIds,
    activeModeFrequencies,
    displacementField,
    sandDensity,
    monitoring,
    setMonitoring,
    monitorVolume,
    setMonitorVolume,
    getMediaStream,
  };
}
