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

/**
 * A simply supported (or approximated) plate's displacement is mathematically
 * zero along the *entire* boundary by definition, which would otherwise make
 * the whole edge read as maximum sand density regardless of the actual mode
 * pattern -- particles pile onto the frame instead of the interior nodal
 * lines that make a Chladni figure recognizable. This fades attraction to
 * zero right at the true edge, rising to full strength a short distance in,
 * so particles respond to the interior pattern instead of the trivial edge.
 */
function edgeFade(shape: PlateShape, x: number, y: number): number {
  const margin = 0.07;
  if (shape === "circle") {
    const dx = x - 0.5;
    const dy = y - 0.5;
    const r = Math.sqrt(dx * dx + dy * dy) / 0.5;
    return Math.max(0, Math.min(1, (1 - r) / margin));
  }
  const distToEdge = Math.min(x, 1 - x, y, 1 - y);
  return Math.max(0, Math.min(1, distToEdge / margin));
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

function scatterParticles(shape: PlateShape, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let x = Math.random();
    let y = Math.random();
    while (!insideShape(shape, x, y)) {
      x = Math.random();
      y = Math.random();
    }
    particles.push({ x, y });
  }
  return particles;
}

export function PlateViewport({
  shape,
  resolution,
  displacementField,
  sandDensity,
  view,
  frozen,
  running,
  resetSignal,
  className,
}: {
  shape: PlateShape;
  resolution: number;
  displacementField: Float32Array | null;
  sandDensity: Float32Array | null;
  view: PlateViewMode;
  frozen: boolean;
  running: boolean;
  /** Bump this (e.g. a counter) to re-scatter particles back to random positions. */
  resetSignal?: number;
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
    if (particlesRef.current.length === 0) particlesRef.current = scatterParticles(shape, 900);
  }, [shape]);

  useEffect(() => {
    if (resetSignal !== undefined) particlesRef.current = scatterParticles(shape, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

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
      } else {
        // Particles always render, even when idle (static) -- previously
        // this branch was replaced entirely by a text message whenever
        // `running` was false, which meant the whole particle field flashed
        // out of existence on every pause/stop transition (and briefly
        // during any transient play/pause event from the audio element).
        // Surrounding page text explains how to start a source instead.
        const particles = particlesRef.current;
        const animate = stateRef.current.running && !stateRef.current.frozen && !prefersReducedMotion;
        const currentShape = stateRef.current.shape;
        ctx.fillStyle = "#dcc38e";
        for (const p of particles) {
          if (animate && sand) {
            const step = 0.02;
            const fade = edgeFade(currentShape, p.x, p.y);
            const densityAt = (x: number, y: number) => sampleGrid(sand, res, x, y) * edgeFade(currentShape, x, y);
            // Centered difference for an unbiased gradient estimate -- a
            // forward-only difference vanishes right at the boundary
            // (clamped) and silently drifts particles toward higher
            // coordinates, which is what caused them to pile up on one side.
            const dxSample = densityAt(Math.min(1, p.x + step), p.y) - densityAt(Math.max(0, p.x - step), p.y);
            const dySample = densityAt(p.x, Math.min(1, p.y + step)) - densityAt(p.x, Math.max(0, p.y - step));
            const density = sampleGrid(sand, res, p.x, p.y) * fade;
            const speed = 0.003 * (1 - density * 0.5);
            p.x += dxSample * 0.5 + (Math.random() - 0.5) * speed;
            p.y += dySample * 0.5 + (Math.random() - 0.5) * speed;
            if (!insideShape(currentShape, p.x, p.y)) {
              // Reflect back inward instead of clamping to the edge, so
              // particles never come to rest pinned against the boundary.
              p.x = Math.min(0.98, Math.max(0.02, p.x));
              p.y = Math.min(0.98, Math.max(0.02, p.y));
              if (!insideShape(currentShape, p.x, p.y)) {
                p.x = 0.5 + (p.x - 0.5) * 0.9;
                p.y = 0.5 + (p.y - 0.5) * 0.9;
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
