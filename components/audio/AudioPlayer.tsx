"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { encodeWav } from "@/lib/audio/signalGenerator";
import { formatDuration } from "@/lib/utils";
import type { DecodedAudio } from "@/lib/audio/decode";

/**
 * Native <audio>-element playback so volume/seek/mute use the browser's real
 * audio pipeline. Restricted to [startS, endS] when that is a strict subset
 * of the file (auto-pauses at endS, seeks land inside the selection).
 */
export function AudioPlayer({
  audio,
  startS,
  endS,
  onTimeUpdate,
}: {
  audio: DecodedAudio;
  startS: number;
  endS: number;
  onTimeUpdate?: (timeS: number) => void;
}) {
  const audioElRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startS);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const src = useMemo(() => URL.createObjectURL(encodeWav(audio.samples, audio.sampleRate)), [audio]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.currentTime < startS || el.currentTime > endS) el.currentTime = startS;
    setCurrentTime(el.currentTime);
  }, [startS, endS]);

  useEffect(() => {
    const el = audioElRef.current;
    if (el) el.volume = muted ? 0 : volume;
  }, [volume, muted]);

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

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
      {src && (
        <audio
          ref={audioElRef}
          src={src}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setCurrentTime(t);
            onTimeUpdate?.(t);
            if (t >= endS) e.currentTarget.pause();
          }}
        />
      )}
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <input
          type="range"
          min={startS}
          max={Math.max(endS, startS + 0.01)}
          step={0.01}
          value={Math.min(Math.max(currentTime, startS), endS)}
          onChange={(e) => {
            const el = audioElRef.current;
            const t = Number(e.target.value);
            if (el) el.currentTime = t;
            setCurrentTime(t);
          }}
          className="h-11 flex-1 accent-[var(--color-sand)]"
          aria-label="Playback position"
        />
        <span className="tabular-nums w-24 shrink-0 text-xs text-[var(--color-text-muted)]">
          {formatDuration(currentTime)} / {formatDuration(endS)}
        </span>
        <button
          onClick={() => setMuted((m) => !m)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            setVolume(Number(e.target.value));
            setMuted(false);
          }}
          className="h-11 w-24 shrink-0 accent-[var(--color-sand)]"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
