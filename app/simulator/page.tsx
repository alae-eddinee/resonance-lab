"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlateViewport, type PlateViewMode } from "@/components/plates/PlateViewport";
import { PlateConfigEditor } from "@/components/plates/PlateConfigEditor";
import { WaveformChart } from "@/components/charts/WaveformChart";
import { SpectrumChart } from "@/components/charts/SpectrumChart";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { Button } from "@/components/ui/Button";
import { SelectField, SliderField } from "@/components/ui/ParameterField";
import { SaveExperimentButton } from "@/components/experiments/SaveExperimentButton";
import { PLATE_PRESETS } from "@/lib/physics/presets";
import { usePlateResponse } from "@/hooks/usePlateResponse";
import { useAnalyserPeaks } from "@/hooks/useAnalyserPeaks";
import { startMicrophone, stopMicrophone, type MicrophoneSession } from "@/lib/audio/microphone";
import { startPlaybackAnalysis, stopPlaybackAnalysis, type PlaybackSession } from "@/lib/audio/playbackAnalyser";
import { useSharedAudioSelection } from "@/lib/audio/sharedAudioStore";
import type { SpectralPeak } from "@/lib/audio/analysis";
import { formatHz } from "@/lib/utils";
import { Play, Square, Mic, MicOff } from "lucide-react";

type Source = "tone" | "upload" | "microphone";

export default function SimulatorPage() {
  const [controlMode, setControlMode] = useState<"basic" | "advanced">("basic");
  const [plate, setPlate] = useState(PLATE_PRESETS[0]);
  const [source, setSource] = useState<Source>("tone");
  const [viewMode, setViewMode] = useState<PlateViewMode>("particles");

  const [toneFrequency, setToneFrequency] = useState(220);
  const [excitationLevel, setExcitationLevel] = useState(0.6);

  const [micSession, setMicSession] = useState<MicrophoneSession | null>(null);
  const [micStatus, setMicStatus] = useState<"idle" | "pending" | "active" | "denied">("idle");
  const [playbackSession, setPlaybackSession] = useState<PlaybackSession | null>(null);
  const sharedAudio = useSharedAudioSelection();

  const activeAnalyser = source === "microphone" ? micSession?.analyser ?? null : source === "upload" ? playbackSession?.analyser ?? null : null;
  const activeSampleRate =
    source === "microphone"
      ? micSession?.audioContext.sampleRate ?? 44100
      : source === "upload"
        ? playbackSession?.audioContext.sampleRate ?? 44100
        : 44100;

  const { waveform, magnitudes, peaks, rmsLevel, getPeaksSnapshot } = useAnalyserPeaks(activeAnalyser, activeSampleRate);

  const tonePeaksRef = useRef<SpectralPeak[]>([]);
  useEffect(() => {
    tonePeaksRef.current = [{ bin: 0, frequencyHz: toneFrequency, magnitude: excitationLevel }];
  }, [toneFrequency, excitationLevel]);

  const getPeaks = useCallback(() => {
    if (source === "tone") return tonePeaksRef.current;
    return getPeaksSnapshot();
  }, [source, getPeaksSnapshot]);

  const isActive = source === "tone" || (source === "microphone" && micStatus === "active") || (source === "upload" && !!playbackSession);

  const response = usePlateResponse(plate, getPeaks, { active: isActive, updateRateHz: source === "tone" ? 12 : 24 });

  useEffect(() => {
    return () => {
      if (micSession) void stopMicrophone(micSession);
      if (playbackSession) void stopPlaybackAnalysis(playbackSession);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleMicrophone() {
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

  async function togglePlayback() {
    if (playbackSession) {
      await stopPlaybackAnalysis(playbackSession);
      setPlaybackSession(null);
      return;
    }
    if (!sharedAudio) return;
    const session = startPlaybackAnalysis(
      sharedAudio.audio.samples,
      sharedAudio.audio.sampleRate,
      sharedAudio.startS,
      sharedAudio.endS,
      2048,
    );
    setPlaybackSession(session);
  }

  const dominantPeak = source === "tone" ? toneFrequency : peaks[0]?.frequencyHz ?? null;

  return (
    <div>
      <PageHeader
        title="Plate Simulator"
        description="Configure a virtual plate and controlled excitation."
        actions={
          <SaveExperimentButton
            disabled={!response.displacementField}
            disabledReason="Start a source to save a result"
            buildRecord={() => ({
              sourceType: source === "microphone" ? "microphone" : source === "upload" ? "upload" : "generator",
              evidenceCategories:
                source === "tone" ? ["educational-mapping", "physics-simulation"] : ["measured-audio", "physics-simulation"],
              plateConfig: plate,
              activeModeIds: response.activeModeIds,
              measurements: { dominantFrequencyHz: dominantPeak ?? 0 },
            })}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{plate.name}</span>
              <EvidenceBadge category={source === "tone" ? "educational-mapping" : "measured-audio"} />
              <EvidenceBadge category="physics-simulation" />
            </div>
            <p className="mb-2 text-xs text-[var(--color-text-muted)]">
              {source === "tone"
                ? "A synthetic tone (educational mapping) drives a physics-based plate displacement model."
                : "Measured audio features drive a physics-based plate displacement model."}
            </p>
            <PlateViewport
              shape={plate.geometry.shape}
              resolution={plate.simulationResolution}
              displacementField={response.displacementField}
              sandDensity={response.sandDensity}
              view={viewMode}
              frozen={false}
              running={isActive}
              className="mx-auto max-w-[560px]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-divider)] pt-3">
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
          </div>

          {source !== "tone" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ChartPanel title="Waveform" evidence="measured-audio">
                <WaveformChart samples={waveform} />
              </ChartPanel>
              <ChartPanel title="Spectrum" evidence="measured-audio">
                <SpectrumChart magnitudes={magnitudes} sampleRate={activeSampleRate} fftSize={2048} />
              </ChartPanel>
            </div>
          )}

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
              className={`flex-1 rounded-[var(--radius-xs)] py-2 text-sm ${controlMode === "basic" ? "bg-[var(--color-violet-surface)]" : ""}`}
            >
              Basic
            </button>
            <button
              onClick={() => setControlMode("advanced")}
              className={`flex-1 rounded-[var(--radius-xs)] py-2 text-sm ${controlMode === "advanced" ? "bg-[var(--color-violet-surface)]" : ""}`}
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
            <>
              <SliderField
                label="Drive frequency"
                unit="Hz"
                value={toneFrequency}
                min={20}
                max={2000}
                step={1}
                onChange={setToneFrequency}
                logScale
              />
              <SliderField
                label="Excitation level"
                value={excitationLevel}
                min={0}
                max={1}
                step={0.01}
                onChange={setExcitationLevel}
              />
            </>
          )}

          {source === "microphone" && (
            <Button variant={micStatus === "active" ? "secondary" : "primary"} onClick={toggleMicrophone}>
              {micStatus === "active" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {micStatus === "active" ? "Stop microphone" : "Start microphone"}
            </Button>
          )}
          {micStatus === "denied" && (
            <p className="text-sm text-[var(--color-danger)]">Microphone permission denied.</p>
          )}

          {source === "upload" && (
            <>
              {sharedAudio ? (
                <>
                  <p className="text-sm text-[var(--color-text-secondary)]">{sharedAudio.fileName}</p>
                  <Button variant={playbackSession ? "secondary" : "primary"} onClick={togglePlayback}>
                    {playbackSession ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {playbackSession ? "Stop playback" : "Play selection"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No audio selected. Upload audio in the Audio Laboratory and choose &ldquo;Send selection to
                  simulator&rdquo;.
                </p>
              )}
            </>
          )}

          <PlateConfigEditor config={plate} onChange={setPlate} controlMode={controlMode} />

          {source !== "tone" && (
            <p className="text-xs tabular-nums text-[var(--color-text-muted)]">RMS: {rmsLevel.toFixed(3)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
