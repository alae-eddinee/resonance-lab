"use client";

import { useEffect, useRef } from "react";
import type { PlateShape } from "@/lib/physics/types";

export type PlateViewMode = "particles" | "displacement" | "nodal";

interface Particle {
  x: number;
  y: number;
}

function sampleGrid(field: Float32Array, resolution: number, x: number, y: number): number {
  const xi = Math.min(resolution - 1, Math.max(0, Math.floor(x * resolution)));
  const yi = Math.min(resolution - 1, Math.max(0, Math.floor(y * resolution)));
  return field[yi * resolution + xi] ?? 0;
}

function insideShape(shape: PlateShape, x: number, y: number): boolean {
  if (shape !== "circle") return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  const dx = x - 0.5;
  const dy = y - 0.5;
  return dx * dx + dy * dy <= 0.25;
}

function diverging(value: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [-1, [0x89, 0xbe, 0xd1]],
    [0, [0x25, 0x28, 0x2f]],
    [1, [0xdc, 0xc3, 0x8e]],
  ];
  const t = Math.max(-1, Math.min(1, value));
  const [a, b] = t < 0 ? [stops[0], stops[1]] : [stops[1], stops[2]];
  const localT = t < 0 ? t + 1 : t;
  const mix = (x: number, y: number) => Math.round(x + (y - x) * localT);
  return [mix(a[1][0], b[1][0]), mix(a[1][1], b[1][1]), mix(a[1][2], b[1][2])];
}

export function PlateViewport({
  shape,
  resolution,
  displacementField,
  sandDensity,
  view,
  frozen,
  running,
  className,
}: {
  shape: PlateShape;
  resolution: number;
  displacementField: Float32Array | null;
  sandDensity: Float32Array | null;
  view: PlateViewMode;
  frozen: boolean;
  running: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const fieldRef = useRef({ displacementField, sandDensity, resolution });
  const stateRef = useRef({ view, frozen, running, shape });

  useEffect(() => {
    fieldRef.current = { displacementField, sandDensity, resolution };
    stateRef.current = { view, frozen, running, shape };
  }, [displacementField, sandDensity, resolution, view, frozen, running, shape]);

  useEffect(() => {
    if (particlesRef.current.length === 0) {
      const particles: Particle[] = [];
      for (let i = 0; i < 900; i++) {
        let x = Math.random();
        let y = Math.random();
        while (!insideShape(shape, x, y)) {
          x = Math.random();
          y = Math.random();
        }
        particles.push({ x, y });
      }
      particlesRef.current = particles;
    }
  }, [shape]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw() {
      const canvas2 = canvasRef.current;
      if (!canvas2 || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const size = canvas2.clientWidth;
      if (canvas2.width !== size * dpr) {
        canvas2.width = size * dpr;
        canvas2.height = size * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      ctx.fillStyle = "#141516";
      if (stateRef.current.shape === "circle") {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, size, size);
      }

      const { displacementField: field, sandDensity: sand, resolution: res } = fieldRef.current;
      const { view: currentView } = stateRef.current;

      if (currentView === "displacement" && field) {
        const cell = size / res;
        for (let yi = 0; yi < res; yi++) {
          for (let xi = 0; xi < res; xi++) {
            const xNorm = (xi + 0.5) / res;
            const yNorm = (yi + 0.5) / res;
            if (!insideShape(stateRef.current.shape, xNorm, yNorm)) continue;
            const value = field[yi * res + xi];
            const [r, g, b] = diverging(value);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(xi * cell, yi * cell, cell + 1, cell + 1);
          }
        }
      } else if (currentView === "nodal" && field) {
        const cell = size / res;
        for (let yi = 0; yi < res; yi++) {
          for (let xi = 0; xi < res; xi++) {
            const xNorm = (xi + 0.5) / res;
            const yNorm = (yi + 0.5) / res;
            if (!insideShape(stateRef.current.shape, xNorm, yNorm)) continue;
            const value = field[yi * res + xi];
            if (Math.abs(value) < 0.06) {
              ctx.fillStyle = "#dcc38e";
              ctx.fillRect(xi * cell, yi * cell, cell + 1, cell + 1);
            }
          }
        }
      } else if (!stateRef.current.running) {
        ctx.font = "13px sans-serif";
        ctx.fillStyle = "#9ba3b0";
        ctx.textAlign = "center";
        ctx.fillText("Start a source to drive this simulation", size / 2, size / 2);
        ctx.textAlign = "left";
      } else {
        const particles = particlesRef.current;
        const animate = stateRef.current.running && !stateRef.current.frozen && !prefersReducedMotion;
        ctx.fillStyle = "#dcc38e";
        for (const p of particles) {
          if (animate && sand) {
            const density = sampleGrid(sand, res, p.x, p.y);
            const dxSample = sampleGrid(sand, res, Math.min(1, p.x + 0.02), p.y) - density;
            const dySample = sampleGrid(sand, res, p.x, Math.min(1, p.y + 0.02)) - density;
            const speed = 0.0025 * (1 - density * 0.6);
            p.x += dxSample * 0.4 + (Math.random() - 0.5) * speed;
            p.y += dySample * 0.4 + (Math.random() - 0.5) * speed;
            if (!insideShape(stateRef.current.shape, p.x, p.y)) {
              p.x = Math.min(1, Math.max(0, p.x));
              p.y = Math.min(1, Math.max(0, p.y));
              if (!insideShape(stateRef.current.shape, p.x, p.y)) {
                p.x = 0.5;
                p.y = 0.5;
              }
            }
          }
          ctx.beginPath();
          ctx.arc(p.x * size, p.y * size, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Simulated ${shape} plate, ${view} view, ${running ? (frozen ? "frozen" : "running") : "idle"}`}
        className="aspect-square w-full rounded-[var(--radius-sm)]"
      />
    </div>
  );
}
