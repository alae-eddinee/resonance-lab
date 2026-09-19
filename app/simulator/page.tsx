"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlateViewport, type PlateViewMode } from "@/components/plates/PlateViewport";
import { PlateConfigEditor } from "@/components/plates/PlateConfigEditor";
import { ProcessedRunPlayer } from "@/components/plates/ProcessedRunPlayer";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { Button } from "@/components/ui/Button";
import { SelectField, SliderField } from "@/components/ui/ParameterField";
import { SaveExperimentButton } from "@/components/experiments/SaveExperimentButton";
import { PLATE_PRESETS } from "@/lib/physics/presets";
import { usePlateResponse } from "@/hooks/usePlateResponse";
import { useOfflineProcessing } from "@/hooks/useOfflineProcessing";
import { startMicrophone, stopMicrophone, type MicrophoneSession } from "@/lib/audio/microphone";
import { useAnalyserPeaks } from "@/hooks/useAnalyserPeaks";
import { startTone, stopTone, setToneFrequency, setToneVolume, type ToneOscillatorSession } from "@/lib/audio/toneOscillator";
import { encodeWav } from "@/lib/audio/signalGenerator";
import { useSharedAudioSelection } from "@/lib/audio/sharedAudioStore";
import type { SpectralPeak } from "@/lib/audio/analysis";
import { formatHz } from "@/lib/utils";
import { Play, Square, Loader2, Mic, MicOff } from "lucide-react";

type Source = "tone" | "upload" | "microphone";

export default function SimulatorPage() {
  const [controlMode, setControlMode] = useState<"basic" | "advanced">("basic");
  const [plate, setPlate] = useState(PLATE_PRESETS[0]);
  const [source, setSource] = useState<Source>("tone");
  const [viewMode, setViewMode] = useState<PlateViewMode>("particles");

  const [toneFrequency, setToneFrequencyState] = useState(220);
  const [volume, setVolume] = useState(0.5);

  const [toneSession, setToneSession] = useState<ToneOscillatorSession | null>(null);
  const [micSession, setMicSession] = useState<MicrophoneSession | null>(null);
  const [micStatus, setMicStatus] = useState<"idle" | "pending" | "active" | "denied">("idle");
  const sharedAudio = useSharedAudioSelection();
  const offline = useOfflineProcessing();

  const activeAnalyser = source === "microphone" ? micSession?.analyser ?? null : null;
  const activeSampleRate = micSession?.audioContext.sampleRate ?? 44100;
  const { peaks, rmsLevel, getPeaksSnapshot } = useAnalyserPeaks(activeAnalyser, activeSampleRate);

  const tonePeaksRef = useRef<SpectralPeak[]>([]);
  useEffect(() => {
    tonePeaksRef.current = [{ bin: 0, frequencyHz: toneFrequency, magnitude: volume }];
  }, [toneFrequency, volume]);

  const getPeaks = useCallback(() => {
    if (source === "tone") return tonePeaksRef.current;
    return getPeaksSnapshot();
  }, [source, getPeaksSnapshot]);

  const isPlaying = (source === "tone" && !!toneSession) || (source === "microphone" && micStatus === "active");

  // Tone and live microphone still use the real-time path (tone is a constant
  // single frequency so it never glitches; microphone has no recording to
  // process yet). Uploaded audio instead goes through offline processing so
  // playback is fully smooth regardless of device speed -- see ProcessedRunPlayer.
  const response = usePlateResponse(plate, getPeaks, {
    active: isPlaying,
    updateRateHz: source === "tone" ? 20 : 24,
    mode: "demonstration",
  });

  useEffect(() => {
    return () => {
      if (toneSession) void stopTone(toneSession);
      if (micSession) void stopMicrophone(micSession);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (source !== "tone" && toneSession) void stopTone(toneSession).then(() => setToneSession(null));
    if (source !== "microphone" && micSession) void stopMicrophone(micSession).then(() => setMicSession(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    offline.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedAudio]);

  useEffect(() => {
    if (toneSession) setToneFrequency(toneSession, toneFrequency);
  }, [toneFrequency, toneSession]);

  useEffect(() => {
    if (toneSession) setToneVolume(toneSession, volume);
  }, [volume, toneSession]);

  async function handlePlayToggle() {
    if (source === "tone") {
      if (toneSession) {
        await stopTone(toneSession);
        setToneSession(null);
      } else {
        setToneSession(startTone(toneFrequency, volume));
      }
      return;
    }
    if (source === "microphone") {
      if (micSession) {
        await stopMicrophone(micSession);
        setMicSession(null);
        setMicStatus("idle");
        return;
      }
      setMicStatus("pending");
      try {
        const session = await startMicrophone(2048);
        setMicSession(session);
        setMicStatus("active");
      } catch {
        setMicStatus("denied");
      }
    }
  }

  const dominantFrequencyHz = source === "tone" ? (isPlaying ? toneFrequency : null) : peaks[0]?.frequencyHz ?? null;
  const showProcessedPlayer = source === "upload" && offline.status === "done" && offline.run && sharedAudio;

  return (
    <div>
      <PageHeader
        title="Plate Simulator"
        description="Pick a source, hit play, and watch the plate respond."
        actions={
          <SaveExperimentButton
            disabled={!(response.displacementField || showProcessedPlayer)}
            disabledReason="Press play to generate a result"
            mediaBlob={
              showProcessedPlayer && sharedAudio
                ? encodeWav(
                    sharedAudio.audio.samples.subarray(
                      Math.floor(sharedAudio.startS * sharedAudio.audio.sampleRate),
                      Math.floor(sharedAudio.endS * sharedAudio.audio.sampleRate),
                    ),
                    sharedAudio.audio.sampleRate,
                  )
                : undefined
            }
            buildRecord={() => ({
              sourceType: source === "microphone" ? "microphone" : source === "upload" ? "upload" : "generator",
              evidenceCategories:
                source === "tone" ? ["educational-mapping", "physics-simulation"] : ["measured-audio", "physics-simulation"],
              plateConfig: plate,
              activeModeIds: showProcessedPlayer ? offline.run!.frames.at(-1)?.weights ? Object.keys(offline.run!.frames.at(-1)!.weights) : [] : response.activeModeIds,
              measurements: { dominantFrequencyHz: dominantFrequencyHz ?? 0, rmsLevel },
              audioMeta:
                showProcessedPlayer && sharedAudio
                  ? {
                      durationS: sharedAudio.endS - sharedAudio.startS,
                      sampleRate: sharedAudio.audio.sampleRate,
                      channels: 1,
                      fileName: sharedAudio.fileName,
                    }
                  : undefined,
              sourceDetails:
                source === "tone"
                  ? { toneFrequencyHz: toneFrequency }
                  : showProcessedPlayer && sharedAudio
                    ? { startS: sharedAudio.startS, endS: sharedAudio.endS }
                    : undefined,
            })}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:p-8">
        <div className="flex flex-col gap-4">
          {showProcessedPlayer ? (
            <ProcessedRunPlayer
              audio={sharedAudio.audio}
              startS={sharedAudio.startS}
              endS={sharedAudio.endS}
              run={offline.run!}
              viewMode={viewMode}
              evidence="measured-audio"
            />
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{plate.name}</span>
                <EvidenceBadge category={source === "tone" ? "educational-mapping" : "measured-audio"} />
                <EvidenceBadge category="physics-simulation" />
              </div>
              <PlateViewport
                shape={plate.geometry.shape}
                resolution={plate.simulationResolution}
                displacementField={response.displacementField}
                sandDensity={response.sandDensity}
                view={viewMode}
                frozen={false}
                running={isPlaying}
                className="mx-auto max-w-[560px]"
              />

              {source === "upload" ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-divider)] pt-3">
                  {sharedAudio ? (
                    <Button
                      variant="primary"
                      disabled={offline.status === "processing"}
                      onClick={() => offline.process(plate, sharedAudio.audio, sharedAudio.startS, sharedAudio.endS)}
                    >
                      {offline.status === "processing" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {offline.status === "processing" ? `Processing… ${Math.round(offline.progress * 100)}%` : "Process"}
                    </Button>
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      No audio selected yet. Upload audio in the Audio Laboratory and choose &ldquo;Send selection to
                      simulator&rdquo;.
                    </p>
                  )}
                  <SelectField
                    label="View"
                    value={viewMode}
                    onChange={(v) => setViewMode(v as PlateViewMode)}
                    options={[
                      { value: "particles", label: "Particles" },
                      { value: "displacement", label: "Displacement" },
                      { value: "nodal", label: "Nodal contours" },
                    ]}
                  />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-divider)] pt-3">
                  <Button variant={isPlaying ? "secondary" : "primary"} onClick={handlePlayToggle}>
                    {source === "microphone" ? (
                      isPlaying ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )
                    ) : isPlaying ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isPlaying ? "Stop" : "Play"}
                  </Button>
                  {source === "tone" && (
                    <div className="flex min-w-[140px] flex-1 items-center gap-2">
                      <span className="text-xs text-[var(--color-text-muted)]">Volume</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="h-11 flex-1 accent-[var(--color-sand)]"
                        aria-label="Volume"
                      />
                    </div>
                  )}
                  <SelectField
                    label="View"
                    value={viewMode}
                    onChange={(v) => setViewMode(v as PlateViewMode)}
                    options={[
                      { value: "particles", label: "Particles" },
                      { value: "displacement", label: "Displacement" },
                      { value: "nodal", label: "Nodal contours" },
                    ]}
                  />
                </div>
              )}
              {micStatus === "denied" && (
                <p className="mt-2 text-sm text-[var(--color-danger)]">Microphone permission denied.</p>
              )}
              {source === "microphone" && (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Live preview. Analyzed locally; not transmitted or retained unless saved.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 text-sm sm:grid-cols-4">
            <Metric label="Dominant frequency" value={dominantFrequencyHz ? formatHz(dominantFrequencyHz) : "—"} />
            <Metric label="Level" value={isPlaying ? rmsLevel.toFixed(3) : "—"} />
            <Metric
              label="Active modes"
              value={showProcessedPlayer || isPlaying ? String(response.activeModeIds.length) : "—"}
            />
            <Metric label="Plate" value={`${(plate.geometry.thicknessM * 1000).toFixed(2)} mm ${plate.material.name}`} />
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-1 text-sm font-semibold">Resonance table</h3>
            {response.modes[0] && (
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">{response.modes[0].limitation}</p>
            )}
            <table className="w-full text-left text-sm">
              <thead className="text-[var(--color-text-muted)]">
                <tr>
                  <th className="py-1 font-normal">Mode</th>
                  <th className="py-1 font-normal">Predicted frequency</th>
                  <th className="py-1 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {response.modes.slice(0, 10).map((mode) => (
                  <tr key={mode.id} className="border-t border-[var(--color-divider)]">
                    <td className="py-1 tabular-nums whitespace-nowrap">
                      m={mode.m}, n={mode.n}
                    </td>
                    <td className="py-1 tabular-nums">{formatHz(mode.frequencyHz)}</td>
                    <td className="py-1">
                      {response.activeModeIds.includes(mode.id) ? (
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

        <div className="flex flex-col gap-4">
          <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-border-control)] p-1">
            <button
              onClick={() => setControlMode("basic")}
              className={`flex-1 rounded-[var(--radius-xs)] py-2 text-sm transition-colors ${controlMode === "basic" ? "bg-[var(--color-violet-surface)]" : ""}`}
            >
              Basic
            </button>
            <button
              onClick={() => setControlMode("advanced")}
              className={`flex-1 rounded-[var(--radius-xs)] py-2 text-sm transition-colors ${controlMode === "advanced" ? "bg-[var(--color-violet-surface)]" : ""}`}
            >
              Advanced
            </button>
          </div>

          <SelectField
            label="Plate preset"
            value={plate.id}
            onChange={(id) => setPlate(PLATE_PRESETS.find((p) => p.id === id) ?? PLATE_PRESETS[0])}
            options={PLATE_PRESETS.map((p) => ({ value: p.id, label: p.name }))}
          />

          <SelectField
            label="Source"
            value={source}
            onChange={(v) => setSource(v as Source)}
            options={[
              { value: "tone", label: "Tone" },
              { value: "upload", label: "Uploaded audio" },
              { value: "microphone", label: "Microphone" },
            ]}
          />

          {source === "tone" && (
            <SliderField
              label="Frequency"
              unit="Hz"
              value={toneFrequency}
              min={20}
              max={2000}
              step={1}
              onChange={setToneFrequencyState}
              logScale
            />
          )}

          {source === "upload" && sharedAudio && (
            <p className="text-sm text-[var(--color-text-secondary)]">{sharedAudio.fileName}</p>
          )}

          <PlateConfigEditor config={plate} onChange={setPlate} controlMode={controlMode} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="tabular-nums text-lg font-semibold">{value}</p>
    </div>
  );
}
