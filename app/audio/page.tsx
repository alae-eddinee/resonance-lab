"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { WaveformChart } from "@/components/charts/WaveformChart";
import { SpectrumChart } from "@/components/charts/SpectrumChart";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { Button } from "@/components/ui/Button";
import { SliderField, SelectField, ControlSection } from "@/components/ui/ParameterField";
import { decodeAudioFile, type DecodedAudio } from "@/lib/audio/decode";
import { SignalGeneratorPanel } from "@/components/audio/SignalGeneratorPanel";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { setSharedAudioSelection } from "@/lib/audio/sharedAudioStore";
import { magnitudeSpectrum } from "@/lib/audio/fft";
import { applyWindow, windowCoefficients } from "@/lib/audio/windows";
import {
  rms,
  peakAmplitude,
  spectralCentroid,
  spectralBandwidth,
  spectralRolloff,
  zeroCrossingRate,
  estimateFundamentalFrequency,
  frequencyToNoteName,
  bandEnergies,
} from "@/lib/audio/analysis";
import { formatDuration, formatHz } from "@/lib/utils";

export default function AudioPage() {
  const router = useRouter();
  const [audio, setAudio] = useState<DecodedAudio | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [scrubS, setScrubS] = useState(0);
  const [startS, setStartS] = useState(0);
  const [endS, setEndS] = useState(0);
  const [fftSize, setFftSize] = useState(2048);

  async function handleFile(file: File) {
    setError(null);
    try {
      const decoded = await decodeAudioFile(file);
      setAudio(decoded);
      setFileName(file.name);
      setScrubS(0);
      setStartS(0);
      setEndS(decoded.durationS);
    } catch {
      setError("Could not decode this audio file. Try WAV, MP3, M4A, or FLAC.");
    }
  }

  const window = useMemo(() => audio && extractWindow(audio, scrubS, fftSize), [audio, scrubS, fftSize]);
  const analysis = useMemo(() => window && analyzeWindow(window, audio!.sampleRate, fftSize), [window, audio, fftSize]);

  return (
    <div>
      <PageHeader
        title="Audio Laboratory"
        description="Inspect uploaded audio, select an interval, and send it to the plate simulator."
      />

      <div className="p-4 md:p-6 lg:p-8">
        {!audio ? (
          <div className="flex flex-col gap-4">
            <FileDropzone accept="audio/*" label="Choose audio" onFile={handleFile} />
            <SignalGeneratorPanel
              onUse={(generated, name) => {
                setAudio(generated);
                setFileName(name);
                setScrubS(0);
                setStartS(0);
                setEndS(generated.durationS);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text)]">{fileName}</span>
                <span>{formatDuration(audio.durationS)}</span>
                <span>{audio.sampleRate} Hz</span>
                <span>{audio.channels} channel(s), mixed to mono for analysis</span>
              </div>
            </div>

            <AudioPlayer
              audio={audio}
              startS={startS}
              endS={endS || audio.durationS}
              onTimeUpdate={setScrubS}
            />

            <ChartPanel title="Waveform" evidence="measured-audio" caption="Click to move the analysis cursor.">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const t = ((e.clientX - rect.left) / rect.width) * audio.durationS;
                  setScrubS(Math.max(0, Math.min(audio.durationS, t)));
                }}
                className="cursor-crosshair"
              >
                <WaveformChart samples={audio.samples} />
              </div>
              <p className="mt-1 text-xs tabular-nums text-[var(--color-text-muted)]">
                Cursor: {scrubS.toFixed(2)} s
              </p>
            </ChartPanel>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ChartPanel title="Spectrum at cursor" evidence="measured-audio">
                <SpectrumChart magnitudes={analysis?.magnitudes ?? null} sampleRate={audio.sampleRate} fftSize={fftSize} />
              </ChartPanel>
              <div className="flex flex-col gap-3">
                <SliderField
                  label="Start time"
                  unit="s"
                  value={startS}
                  min={0}
                  max={audio.durationS}
                  step={0.01}
                  onChange={setStartS}
                />
                <SliderField
                  label="End time"
                  unit="s"
                  value={endS}
                  min={0}
                  max={audio.durationS}
                  step={0.01}
                  onChange={setEndS}
                />
                <Button variant="tertiary" onClick={() => { setStartS(0); setEndS(audio.durationS); }}>
                  Use whole file
                </Button>
                <ControlSection title="Advanced analysis settings">
                  <SelectField
                    label="FFT size"
                    value={String(fftSize)}
                    onChange={(v) => setFftSize(Number(v))}
                    options={[1024, 2048, 4096, 8192].map((n) => ({ value: String(n), label: `${n} samples` }))}
                  />
                </ControlSection>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 text-sm sm:grid-cols-4">
              <Metric label="RMS" value={analysis ? analysis.rms.toFixed(3) : "—"} />
              <Metric label="Peak amplitude" value={analysis ? analysis.peak.toFixed(3) : "—"} />
              <Metric label="Spectral centroid" value={analysis ? formatHz(analysis.centroid) : "—"} />
              <Metric label="Spectral bandwidth" value={analysis ? formatHz(analysis.bandwidth) : "—"} />
              <Metric label="Spectral rolloff" value={analysis ? formatHz(analysis.rolloff) : "—"} />
              <Metric label="Zero-crossing rate" value={analysis ? analysis.zcr.toFixed(3) : "—"} />
              <Metric
                label="Fundamental estimate"
                value={analysis?.fundamental ? `${formatHz(analysis.fundamental)} (${frequencyToNoteName(analysis.fundamental)})` : "Unavailable"}
              />
            </div>

            {analysis && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
                <h3 className="mb-2 text-sm font-semibold">Frequency-band energy</h3>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {analysis.bands.map((band) => (
                      <tr key={band.label} className="border-t border-[var(--color-divider)]">
                        <td className="py-1">{band.label}</td>
                        <td className="py-1 text-[var(--color-text-muted)]">
                          {band.lowHz}–{band.highHz} Hz
                        </td>
                        <td className="py-1 tabular-nums">{band.energy.toExponential(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setSharedAudioSelection({ audio, fileName, startS, endS });
                  router.push("/simulator?source=audio");
                }}
              >
                Send selection to simulator
              </Button>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
      </div>
    </div>
  );
}

function extractWindow(audio: DecodedAudio, centerS: number, fftSize: number): Float32Array {
  const centerSample = Math.floor(centerS * audio.sampleRate);
  const start = Math.max(0, Math.min(audio.samples.length - fftSize, centerSample - fftSize / 2));
  return audio.samples.slice(start, start + fftSize);
}

function analyzeWindow(chunk: Float32Array, sampleRate: number, fftSize: number) {
  const padded = chunk.length === fftSize ? chunk : padTo(chunk, fftSize);
  const windowed = applyWindow(padded, windowCoefficients("hann", fftSize));
  const magnitudes = magnitudeSpectrum(windowed);
  const centroid = spectralCentroid(magnitudes, sampleRate, fftSize);
  return {
    magnitudes,
    rms: rms(padded),
    peak: peakAmplitude(padded),
    centroid,
    bandwidth: spectralBandwidth(magnitudes, sampleRate, fftSize, centroid),
    rolloff: spectralRolloff(magnitudes, sampleRate, fftSize),
    zcr: zeroCrossingRate(padded),
    fundamental: estimateFundamentalFrequency(padded, sampleRate),
    bands: bandEnergies(magnitudes, sampleRate, fftSize),
  };
}

function padTo(chunk: Float32Array, size: number): Float32Array {
  const out = new Float32Array(size);
  out.set(chunk.subarray(0, Math.min(chunk.length, size)));
  return out;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="tabular-nums text-lg font-semibold">{value}</p>
    </div>
  );
}
