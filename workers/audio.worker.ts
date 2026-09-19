import { magnitudeSpectrum } from "../lib/audio/fft";
import { applyWindow, windowCoefficients } from "../lib/audio/windows";
import {
  findSpectralPeaks,
  rms,
  spectralCentroid,
  estimateFundamentalFrequency,
} from "../lib/audio/analysis";

export interface AudioAnalysisRequest {
  requestId: number;
  samples: Float32Array;
  sampleRate: number;
  fftSize: number;
  hopSize: number;
}

export interface AudioAnalysisFrame {
  timeS: number;
  rms: number;
  centroidHz: number;
  fundamentalHz: number | null;
  peakFrequencyHz: number;
}

export interface AudioAnalysisResponse {
  requestId: number;
  frames: AudioAnalysisFrame[];
  spectrogram: Float32Array[];
}

self.onmessage = (event: MessageEvent<AudioAnalysisRequest>) => {
  const { requestId, samples, sampleRate, fftSize, hopSize } = event.data;
  const window = windowCoefficients("hann", fftSize);
  const frames: AudioAnalysisFrame[] = [];
  const spectrogram: Float32Array[] = [];

  for (let start = 0; start + fftSize <= samples.length; start += hopSize) {
    const chunk = samples.subarray(start, start + fftSize);
    const windowed = applyWindow(chunk as Float32Array, window);
    const mag = magnitudeSpectrum(windowed);
    spectrogram.push(mag);

    const peaks = findSpectralPeaks(mag, sampleRate, fftSize, { count: 1 });
    frames.push({
      timeS: start / sampleRate,
      rms: rms(chunk as Float32Array),
      centroidHz: spectralCentroid(mag, sampleRate, fftSize),
      fundamentalHz: estimateFundamentalFrequency(chunk as Float32Array, sampleRate),
      peakFrequencyHz: peaks[0]?.frequencyHz ?? 0,
    });
  }

  const response: AudioAnalysisResponse = { requestId, frames, spectrogram };
  (self as unknown as Worker).postMessage(response);
};
