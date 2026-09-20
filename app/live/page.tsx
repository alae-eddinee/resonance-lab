"use client";

import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlateViewport, type PlateViewMode } from "@/components/plates/PlateViewport";
import { ProcessedRunPlayer } from "@/components/plates/ProcessedRunPlayer";
import { WaveformChart } from "@/components/charts/WaveformChart";
import { SpectrumChart } from "@/components/charts/SpectrumChart";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { Button } from "@/components/ui/Button";
import { SliderField, SelectField, ControlSection } from "@/components/ui/ParameterField";
import { useLiveCymatics, DEFAULT_LIVE_SETTINGS } from "@/hooks/useLiveCymatics";
import { useOfflineProcessing } from "@/hooks/useOfflineProcessing";
import { PLATE_PRESETS } from "@/lib/physics/presets";
import { SaveExperimentButton } from "@/components/experiments/SaveExperimentButton";
import { startRecording, stopRecording, type MicRecorderSession } from "@/lib/audio/micRecorder";
import { decodeAudioFile, type DecodedAudio } from "@/lib/audio/decode";
import { encodeWav } from "@/lib/audio/signalGenerator";
import { formatHz } from "@/lib/utils";
import { Mic, MicOff, Snowflake, Circle, Square, Loader2, ArrowLeft, RefreshCw } from "lucide-react";

export default function LivePage() {
  const [controlMode, setControlMode] = useState<"basic" | "advanced">("basic");
  const [presetId, setPresetId] = useState(PLATE_PRESETS[0].id);
  const [settings, setSettings] = useState(DEFAULT_LIVE_SETTINGS);
  const [viewMode, setViewMode] = useState<PlateViewMode>("particles");
  const [particleReset, setParticleReset] = useState(0);
  const [responseMode, setResponseMode] = useState<"scientific" | "demonstration">("demonstration");

  const plate = useMemo(() => PLATE_PRESETS.find((p) => p.id === presetId) ?? PLATE_PRESETS[0], [presetId]);
  const activeSettings = useMemo(() => ({ ...settings, responseMode }), [settings, responseMode]);
  const live = useLiveCymatics(plate, activeSettings);

  const isActive = live.status === "active";

  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<DecodedAudio | null>(null);
  const recorderRef = useRef<MicRecorderSession | null>(null);
  const offline = useOfflineProcessing();
  const showingProcessedTake = !!recordedAudio && offline.status === "done" && !!offline.run;

  async function toggleRecording() {
    if (recording) {
      setRecording(false);
      const session = recorderRef.current;
      if (!session) return;
      const blob = await stopRecording(session);
      recorderRef.current = null;
      try {
        const decoded = await decodeAudioFile(blob);
        setRecordedAudio(decoded);
        await offline.process(plate, decoded, 0, decoded.durationS);
      } catch {
        // Decoding failed; stay on the live view.
      }
      return;
    }
    const stream = live.getMediaStream();
    if (!stream) return;
    recorderRef.current = startRecording(stream);
    setRecording(true);
  }

  function backToLive() {
    setRecordedAudio(null);
    offline.reset();
  }

  return (
    <div>
      <PageHeader
        title="Live Cymatics"
        description="Microphone measurements driving a simulated plate."
        actions={
          showingProcessedTake ? (
            <SaveExperimentButton
              disabled={false}
              disabledReason=""
              mediaBlob={encodeWav(recordedAudio.samples, recordedAudio.sampleRate)}
              buildRecord={() => ({
                sourceType: "microphone",
                evidenceCategories: ["measured-audio", "physics-simulation"],
                plateConfig: plate,
                activeModeIds: offline.run!.frames.at(-1) ? Object.keys(offline.run!.frames.at(-1)!.weights) : [],
                measurements: { durationS: recordedAudio.durationS },
                audioMeta: {
                  durationS: recordedAudio.durationS,
                  sampleRate: recordedAudio.sampleRate,
                  channels: recordedAudio.channels,
                },
                sourceDetails: { startS: 0, endS: recordedAudio.durationS },
              })}
            />
          ) : (
            <SaveExperimentButton
              disabled={!live.displacementField}
              disabledReason="Start a session to save a result"
              buildRecord={() => ({
                sourceType: "microphone",
                evidenceCategories: ["measured-audio", "physics-simulation"],
                plateConfig: plate,
                activeModeIds: live.activeModeIds,
                measurements: {
                  rmsDbfs: Number.isFinite(live.rmsDbfs) ? live.rmsDbfs : -100,
                  dominantFrequencyHz: live.dominantFrequencyHz ?? 0,
                  spectralCentroidHz: live.spectralCentroidHz,
                },
              })}
            />
          )
        }
      />

      <div className="flex flex-col gap-3 border-b border-[var(--color-divider)] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--color-text-secondary)]">
            {live.deviceLabel ?? "No microphone active"}
          </span>
          {live.status === "denied" && (
            <span className="text-[var(--color-danger)]">
              Microphone permission denied. Allow access in your browser settings, then retry.
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-40 overflow-hidden rounded-full bg-[var(--color-surface-raised)]"
            role="meter"
            aria-label="Input level"
            aria-valuemin={-60}
            aria-valuemax={0}
            aria-valuenow={Number.isFinite(live.rmsDbfs) ? Math.round(live.rmsDbfs) : -60}
          >
            <div
              className="h-full bg-[var(--color-cyan)]"
              style={{ width: `${Math.max(0, Math.min(100, ((live.rmsDbfs + 60) / 60) * 100))}%` }}
            />
          </div>
          <span className="tabular-nums text-xs text-[var(--color-text-muted)]">
            Input level: {Number.isFinite(live.rmsDbfs) ? `${live.rmsDbfs.toFixed(0)} dBFS` : "No input"}
            {live.clipping && <span className="ml-1 text-[var(--color-warning)]">Clipping</span>}
          </span>
          {isActive ? (
            <>
              <Button
                variant={recording ? "destructive" : "secondary"}
                onClick={toggleRecording}
                disabled={offline.status === "processing"}
              >
                {recording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {recording ? "Stop recording" : "Record a take"}
              </Button>
              <Button variant="secondary" onClick={() => live.stop()}>
                <MicOff className="h-4 w-4" /> Stop microphone
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => live.start()}>
              <Mic className="h-4 w-4" /> Start microphone
            </Button>
          )}
        </div>
      </div>

      {offline.status === "processing" && (
        <div className="flex items-center gap-2 border-b border-[var(--color-divider)] bg-[var(--color-surface)] px-4 py-3 text-sm md:px-6 lg:px-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing your recording for smooth playback… {Math.round(offline.progress * 100)}%
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:p-8">
        <div className="flex flex-col gap-4">
          {showingProcessedTake && recordedAudio && offline.run ? (
            <>
              <Button variant="tertiary" onClick={backToLive} className="self-start">
                <ArrowLeft className="h-4 w-4" /> Back to live view
              </Button>
              <ProcessedRunPlayer
                audio={recordedAudio}
                startS={0}
                endS={recordedAudio.durationS}
                run={offline.run}
                viewMode={viewMode}
                evidence="measured-audio"
              />
            </>
          ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Simulated plate</span>
                <EvidenceBadge category="measured-audio" />
                <EvidenceBadge category="physics-simulation" />
              </div>
              {live.frozen && (
                <span className="rounded-[var(--radius-xs)] bg-[var(--color-violet-surface)] px-2 py-1 text-xs">
                  Frozen
                </span>
              )}
            </div>
            <PlateViewport
              shape={plate.geometry.shape}
              resolution={plate.simulationResolution}
              displacementField={live.displacementField}
              sandDensity={live.sandDensity}
              view={viewMode}
              frozen={live.frozen}
              running={isActive}
              resetSignal={particleReset}
              className="mx-auto max-w-[560px]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-divider)] pt-3">
              <Button variant="secondary" onClick={() => live.setFrozen(!live.frozen)}>
                <Snowflake className="h-4 w-4" /> {live.frozen ? "Resume visualization" : "Freeze visualization"}
              </Button>
              {viewMode === "particles" && (
                <Button variant="secondary" onClick={() => setParticleReset((n) => n + 1)}>
                  <RefreshCw className="h-4 w-4" /> Reset particles
                </Button>
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
          </div>
          )}

          {!showingProcessedTake && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ChartPanel title="Waveform" evidence="measured-audio">
                  <WaveformChart samples={live.waveform} />
                </ChartPanel>
                <ChartPanel title="Spectrum" evidence="measured-audio">
                  <SpectrumChart
                    magnitudes={live.magnitudes}
                    sampleRate={44100}
                    fftSize={settings.fftSize}
                    minHz={settings.minFrequencyHz}
                  />
                </ChartPanel>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 text-sm sm:grid-cols-4">
                <Metric label="Dominant frequency" value={isActive && live.dominantFrequencyHz ? formatHz(live.dominantFrequencyHz) : "—"} />
                <Metric label="Fundamental estimate" value={isActive && live.fundamentalHz ? formatHz(live.fundamentalHz) : "Unavailable"} />
                <Metric label="Spectral centroid" value={isActive ? formatHz(live.spectralCentroidHz) : "—"} />
                <Metric label="Active modes" value={isActive ? String(live.activeModeIds.length) : "—"} />
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
                <h3 className="mb-2 text-sm font-semibold">Nearest plate resonances</h3>
                <table className="w-full text-left text-sm">
                  <thead className="text-[var(--color-text-muted)]">
                    <tr>
                      <th className="py-1 font-normal">Mode</th>
                      <th className="py-1 font-normal">Frequency</th>
                      <th className="py-1 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live.modes.slice(0, 8).map((mode) => (
                      <tr key={mode.id} className="border-t border-[var(--color-divider)]">
                        <td className="py-1 tabular-nums">
                          m={mode.m}, n={mode.n}
                        </td>
                        <td className="py-1 tabular-nums">{formatHz(mode.frequencyHz)}</td>
                        <td className="py-1">
                          {live.activeModeIds.includes(mode.id) ? (
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
            </>
          )}
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
            value={presetId}
            onChange={setPresetId}
            options={PLATE_PRESETS.map((p) => ({ value: p.id, label: p.name }))}
          />

          <SliderField
            label="Input sensitivity"
            value={settings.sensitivity}
            min={0.1}
            max={4}
            step={0.1}
            onChange={(v) => setSettings((s) => ({ ...s, sensitivity: v }))}
          />

          <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={live.monitoring}
                onChange={(e) => live.setMonitoring(e.target.checked)}
                disabled={!isActive}
                className="h-5 w-5"
              />
              Hear microphone (monitor audio)
            </label>
            {live.monitoring && (
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={live.monitorVolume}
                onChange={(e) => live.setMonitorVolume(Number(e.target.value))}
                className="h-11 accent-[var(--color-sand)]"
                aria-label="Monitor volume"
              />
            )}
            <p className="text-xs text-[var(--color-text-muted)]">
              Off by default to avoid feedback through speakers. Use headphones if you turn this on.
            </p>
          </div>

          {controlMode === "advanced" && (
            <>
              <ControlSection title="Detection">
                <SliderField
                  label="Noise gate"
                  value={settings.noiseGate}
                  min={0}
                  max={0.2}
                  step={0.005}
                  onChange={(v) => setSettings((s) => ({ ...s, noiseGate: v }))}
                />
                <SelectField
                  label="Response mode"
                  value={responseMode}
                  onChange={(v) => setResponseMode(v as "scientific" | "demonstration")}
                  options={[
                    { value: "scientific", label: "Scientific response" },
                    { value: "demonstration", label: "Demonstration response" },
                  ]}
                />
                {responseMode === "demonstration" && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Demonstration mode maps sound to nearby plate modes for educational visualization. It is not a
                    direct physical prediction.
                  </p>
                )}
              </ControlSection>
              <ControlSection title="Input analysis">
                <SelectField
                  label="FFT size"
                  value={String(settings.fftSize)}
                  onChange={(v) => setSettings((s) => ({ ...s, fftSize: Number(v) }))}
                  options={[1024, 2048, 4096, 8192].map((n) => ({ value: String(n), label: `${n} samples` }))}
                />
                <SliderField
                  label="Minimum frequency"
                  unit="Hz"
                  value={settings.minFrequencyHz}
                  min={20}
                  max={500}
                  step={10}
                  onChange={(v) => setSettings((s) => ({ ...s, minFrequencyHz: v }))}
                />
                <SliderField
                  label="Maximum frequency"
                  unit="Hz"
                  value={settings.maxFrequencyHz}
                  min={500}
                  max={10000}
                  step={100}
                  onChange={(v) => setSettings((s) => ({ ...s, maxFrequencyHz: v }))}
                />
                <SliderField
                  label="Number of peaks"
                  value={settings.peakCount}
                  min={1}
                  max={12}
                  step={1}
                  onChange={(v) => setSettings((s) => ({ ...s, peakCount: v }))}
                />
                <SliderField
                  label="Analysis update rate"
                  unit="Hz"
                  value={settings.updateRateHz}
                  min={5}
                  max={60}
                  step={1}
                  onChange={(v) => setSettings((s) => ({ ...s, updateRateHz: v }))}
                />
              </ControlSection>
              <ControlSection title="Response shaping">
                <SliderField
                  label="Attack"
                  value={settings.attack}
                  min={0.05}
                  max={1}
                  step={0.05}
                  onChange={(v) => setSettings((s) => ({ ...s, attack: v }))}
                />
                <SliderField
                  label="Release"
                  value={settings.release}
                  min={0.02}
                  max={1}
                  step={0.02}
                  onChange={(v) => setSettings((s) => ({ ...s, release: v }))}
                />
              </ControlSection>
            </>
          )}

          <p className="text-xs text-[var(--color-text-muted)]">
            Microphone input is analyzed locally in your browser. Raw audio is not transmitted or retained unless you
            explicitly choose to save it with an experiment.
          </p>
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
