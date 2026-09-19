"use client";

import { useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectField, SliderField } from "@/components/ui/ParameterField";
import {
  generateSineWave,
  generateDualTone,
  generateHarmonicSeries,
  generateSweep,
  generateWhiteNoise,
  generatePinkNoise,
  encodeWav,
  type SweepMode,
} from "@/lib/audio/signalGenerator";
import { downloadBlob } from "@/lib/export/exporters";
import type { DecodedAudio } from "@/lib/audio/decode";

type SignalType = "sine" | "dual" | "harmonic" | "sweep" | "noise-white" | "noise-pink";

const SAMPLE_RATE = 44100;

export function SignalGeneratorPanel({ onUse }: { onUse: (audio: DecodedAudio, name: string) => void }) {
  const [type, setType] = useState<SignalType>("sine");
  const [freqA, setFreqA] = useState(440);
  const [freqB, setFreqB] = useState(660);
  const [harmonics, setHarmonics] = useState(4);
  const [startHz, setStartHz] = useState(100);
  const [endHz, setEndHz] = useState(2000);
  const [sweepMode, setSweepMode] = useState<SweepMode>("linear");
  const [durationS, setDurationS] = useState(2);
  const [amplitude, setAmplitude] = useState(0.4);
  const [previewing, setPreviewing] = useState(false);
  const previewElRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  function generate(): Float32Array {
    switch (type) {
      case "dual":
        return generateDualTone(freqA, freqB, durationS, SAMPLE_RATE, amplitude);
      case "harmonic":
        return generateHarmonicSeries(freqA, harmonics, durationS, SAMPLE_RATE, amplitude);
      case "sweep":
        return generateSweep(startHz, endHz, durationS, SAMPLE_RATE, amplitude, sweepMode);
      case "noise-white":
        return generateWhiteNoise(durationS, SAMPLE_RATE, amplitude);
      case "noise-pink":
        return generatePinkNoise(durationS, SAMPLE_RATE, amplitude);
      case "sine":
      default:
        return generateSineWave({ frequencyHz: freqA, durationS, sampleRate: SAMPLE_RATE, amplitude });
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold">Generate a signal</h3>
      <p className="text-xs text-[var(--color-warning)]">
        Audio plays at your device volume. Start low; sustained tones can be uncomfortable at high volume.
      </p>
      <SelectField
        label="Signal type"
        value={type}
        onChange={(v) => setType(v as SignalType)}
        options={[
          { value: "sine", label: "Single sine wave" },
          { value: "dual", label: "Dual tone" },
          { value: "harmonic", label: "Harmonic series" },
          { value: "sweep", label: "Frequency sweep" },
          { value: "noise-white", label: "White noise" },
          { value: "noise-pink", label: "Pink noise" },
        ]}
      />

      {(type === "sine" || type === "dual" || type === "harmonic") && (
        <SliderField label={type === "dual" ? "Frequency A" : "Frequency"} unit="Hz" value={freqA} min={20} max={4000} step={1} onChange={setFreqA} logScale />
      )}
      {type === "dual" && (
        <SliderField label="Frequency B" unit="Hz" value={freqB} min={20} max={4000} step={1} onChange={setFreqB} logScale />
      )}
      {type === "harmonic" && (
        <SliderField label="Harmonic count" value={harmonics} min={1} max={12} step={1} onChange={setHarmonics} />
      )}
      {type === "sweep" && (
        <>
          <SliderField label="Start frequency" unit="Hz" value={startHz} min={20} max={4000} step={1} onChange={setStartHz} logScale />
          <SliderField label="End frequency" unit="Hz" value={endHz} min={20} max={8000} step={1} onChange={setEndHz} logScale />
          <SelectField
            label="Sweep type"
            value={sweepMode}
            onChange={(v) => setSweepMode(v as SweepMode)}
            options={[
              { value: "linear", label: "Continuous linear" },
              { value: "logarithmic", label: "Continuous logarithmic" },
              { value: "stepped", label: "Stepped" },
            ]}
          />
        </>
      )}

      <SliderField label="Duration" unit="s" value={durationS} min={0.5} max={10} step={0.5} onChange={setDurationS} />
      <SliderField label="Amplitude" value={amplitude} min={0.05} max={1} step={0.01} onChange={setAmplitude} />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            if (previewElRef.current) {
              previewElRef.current.pause();
              setPreviewing(false);
            }
            const samples = generate();
            onUse({ samples, sampleRate: SAMPLE_RATE, channels: 1, durationS: samples.length / SAMPLE_RATE }, `Generated ${type}`);
          }}
        >
          Use in this lab
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (previewing && previewElRef.current) {
              previewElRef.current.pause();
              setPreviewing(false);
              return;
            }
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            const samples = generate();
            const url = URL.createObjectURL(encodeWav(samples, SAMPLE_RATE));
            previewUrlRef.current = url;
            previewElRef.current?.pause();
            const el = new Audio(url);
            el.onended = () => setPreviewing(false);
            previewElRef.current = el;
            void el.play();
            setPreviewing(true);
          }}
        >
          {previewing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {previewing ? "Stop preview" : "Preview"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const samples = generate();
            downloadBlob(encodeWav(samples, SAMPLE_RATE), `resonance-lab-${type}.wav`);
          }}
        >
          Download WAV
        </Button>
      </div>
    </div>
  );
}
