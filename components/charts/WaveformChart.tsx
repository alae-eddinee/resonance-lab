"use client";

import { useEffect, useRef } from "react";

export function WaveformChart({ samples, height = 160 }: { samples: Float32Array | null; height?: number }) {
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

    ctx.strokeStyle = "#373c45";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (!samples || samples.length === 0) {
      ctx.fillStyle = "#9ba3b0";
      ctx.font = "13px sans-serif";
      ctx.fillText("No measurement", 8, height / 2 - 8);
      return;
    }

    ctx.strokeStyle = "#85cbd2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const step = Math.max(1, Math.floor(samples.length / width));
    for (let x = 0; x < width; x++) {
      const idx = Math.floor(x * step);
      let min = 1;
      let max = -1;
      for (let i = idx; i < Math.min(samples.length, idx + step); i++) {
        min = Math.min(min, samples[i]);
        max = Math.max(max, samples[i]);
      }
      const yMin = height / 2 - (min * height) / 2;
      const yMax = height / 2 - (max * height) / 2;
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();
  }, [samples, height]);

  return <canvas ref={canvasRef} style={{ height }} className="w-full" />;
}
