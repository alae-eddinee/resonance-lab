"use client";

import { useEffect, useRef } from "react";
import { binToFrequency } from "@/lib/audio/fft";

export function SpectrumChart({
  magnitudes,
  sampleRate,
  fftSize,
  height = 160,
  logScale = true,
  minHz = 20,
}: {
  magnitudes: Float32Array | null;
  sampleRate: number;
  fftSize: number;
  height?: number;
  logScale?: boolean;
  minHz?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!magnitudes || magnitudes.length === 0) {
      ctx.fillStyle = "#9ba3b0";
      ctx.font = "13px sans-serif";
      ctx.fillText("No measurement", 8, height / 2);
      return;
    }

    const nyquist = sampleRate / 2;
    const maxMag = Math.max(...Array.from(magnitudes), 1e-6);
    const toX = (freq: number) => {
      if (logScale) {
        const logMin = Math.log10(minHz);
        const logMax = Math.log10(nyquist);
        return ((Math.log10(Math.max(freq, minHz)) - logMin) / (logMax - logMin)) * width;
      }
      return (freq / nyquist) * width;
    };

    ctx.strokeStyle = "#dcc38e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < magnitudes.length; i++) {
      const freq = binToFrequency(i, sampleRate, fftSize);
      if (freq < minHz) continue;
      const x = toX(freq);
      const y = height - (magnitudes[i] / maxMag) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [magnitudes, sampleRate, fftSize, height, logScale, minHz]);

  return <canvas ref={canvasRef} style={{ height }} className="w-full" />;
}
