"use client";

import { useEffect, useRef } from "react";

const RAMP: Array<[number, number, number]> = [
  [0x17, 0x1a, 0x24],
  [0x37, 0x46, 0x6a],
  [0x65, 0x7e, 0x91],
  [0xac, 0xb9, 0x9e],
  [0xf0, 0xd9, 0x9b],
];

function rampColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (RAMP.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const a = RAMP[idx];
  const b = RAMP[Math.min(RAMP.length - 1, idx + 1)];
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac, a[2] + (b[2] - a[2]) * frac];
}

/** Draws a scrolling spectrogram; `frames` is a rolling buffer of magnitude spectra (oldest first). */
export function SpectrogramChart({ frames, height = 200 }: { frames: Float32Array[]; height?: number }) {
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

    if (frames.length === 0) {
      ctx.fillStyle = "#9ba3b0";
      ctx.font = "13px sans-serif";
      ctx.fillText("No measurement", 8, height / 2);
      return;
    }

    const binCount = frames[0].length;
    const colWidth = width / frames.length;
    let maxMag = 1e-6;
    for (const frame of frames) for (const v of frame) if (v > maxMag) maxMag = v;

    frames.forEach((frame, col) => {
      for (let bin = 0; bin < binCount; bin++) {
        const t = Math.log10(1 + (frame[bin] / maxMag) * 9);
        const [r, g, b] = rampColor(t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        const y = height - ((bin + 1) / binCount) * height;
        ctx.fillRect(col * colWidth, y, colWidth + 1, height / binCount + 1);
      }
    });
  }, [frames, height]);

  return <canvas ref={canvasRef} style={{ height }} className="w-full" />;
}
