"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PlateViewport, type PlateViewMode } from "@/components/plates/PlateViewport";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { useRecordedPlayback } from "@/hooks/useRecordedPlayback";
import { encodeWav } from "@/lib/audio/signalGenerator";
import { formatDuration, formatHz } from "@/lib/utils";
import type { RecordedRun } from "@/lib/simulation/offlineProcessor";
import type { DecodedAudio } from "@/lib/audio/decode";

export function ProcessedRunPlayer({
  audio,
  startS,
  endS,
  run,
  viewMode,
  evidence,
  onActiveModesChange,
}: {
  audio: DecodedAudio;
  startS: number;
  endS: number;
  run: RecordedRun;
  viewMode: PlateViewMode;
  evidence: "measured-audio" | "educational-mapping";
  /** Called whenever the currently-playing frame's active modes change, so a parent page can keep its own resonance table/metrics in sync instead of showing a stale live-mode snapshot. */
  onActiveModesChange?: (ids: string[]) => void;
}) {
  const audioElRef = useRef<HTMLAudioElement>(null);
  const timeRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [particleReset, setParticleReset] = useState(0);

  const src = useMemo(() => URL.createObjectURL(encodeWav(audio.samples, audio.sampleRate)), [audio]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  useEffect(() => {
    const el = audioElRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  const getTimeS = useMemo(() => () => timeRef.current, []);
  const playback = useRecordedPlayback(run, getTimeS, playing);

  useEffect(() => {
    onActiveModesChange?.(playback.activeModeIds);
  }, [playback.activeModeIds, onActiveModesChange]);

  function togglePlay() {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      if (el.currentTime >= endS || el.currentTime < startS) el.currentTime = startS;
      void el.play();
    }
  }

  function restart() {
    const el = audioElRef.current;
    if (!el) return;
    el.currentTime = startS;
    timeRef.current = 0;
    void el.play();
  }

  return (
    <div className="flex flex-col gap-3">
      <audio
        ref={audioElRef}
        src={src}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime - startS;
          timeRef.current = Math.max(0, t);
          setCurrentTime(Math.max(0, t));
          if (e.currentTarget.currentTime >= endS) e.currentTarget.pause();
        }}
      />

      <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Processed result</span>
          <EvidenceBadge category={evidence} />
          <EvidenceBadge category="physics-simulation" />
        </div>
        <PlateViewport
          shape={run.plateConfig.geometry.shape}
          resolution={run.plateConfig.simulationResolution}
          displacementField={playback.displacementField}
          sandDensity={playback.sandDensity}
          view={viewMode}
          frozen={false}
          running={playing}
          resetSignal={particleReset}
          className="mx-auto max-w-[560px]"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-divider)] pt-3">
          <Button variant="primary" onClick={togglePlay}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <Button variant="secondary" onClick={restart} aria-label="Restart">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {viewMode === "particles" && (
            <Button variant="secondary" onClick={() => setParticleReset((n) => n + 1)} aria-label="Reset particles">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <input
            type="range"
            min={0}
            max={run.durationS}
            step={0.01}
            value={Math.min(currentTime, run.durationS)}
            onChange={(e) => {
              const el = audioElRef.current;
              const t = Number(e.target.value);
              if (el) el.currentTime = startS + t;
              timeRef.current = t;
              setCurrentTime(t);
            }}
            className="h-11 flex-1 accent-[var(--color-sand)]"
            aria-label="Playback position"
          />
          <span className="tabular-nums w-24 shrink-0 text-xs text-[var(--color-text-muted)]">
            {formatDuration(currentTime)} / {formatDuration(run.durationS)}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-11 w-24 shrink-0 accent-[var(--color-sand)]"
            aria-label="Volume"
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Fully processed in advance, so playback stays smooth regardless of device speed.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
        <h3 className="mb-1 text-sm font-semibold">Resonance table</h3>
        {run.modes[0] && <p className="mb-2 text-xs text-[var(--color-text-muted)]">{run.modes[0].limitation}</p>}
        <table className="w-full text-left text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <th className="py-1 font-normal">Mode</th>
              <th className="py-1 font-normal">Predicted frequency</th>
              <th className="py-1 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {run.modes.slice(0, 10).map((mode) => (
              <tr key={mode.id} className="border-t border-[var(--color-divider)]">
                <td className="py-1 tabular-nums whitespace-nowrap">
                  m={mode.m}, n={mode.n}
                </td>
                <td className="py-1 tabular-nums">{formatHz(mode.frequencyHz)}</td>
                <td className="py-1">
                  {playback.activeModeIds.includes(mode.id) ? (
                    <span className="text-[var(--color-sand)]">Active</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
