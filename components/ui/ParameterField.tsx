"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function SliderField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  logScale = false,
}: {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  logScale?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-[var(--color-text-secondary)]">
          {label} {logScale && <span className="text-xs">(log scale)</span>}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={Number(value.toFixed(4))}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            className="tabular-nums w-20 rounded-[var(--radius-sm)] border border-[var(--color-border-control)] bg-[var(--color-surface)] px-2 py-1 text-right text-sm"
            aria-label={`${label} numeric value`}
          />
          {unit && <span className="text-xs text-[var(--color-text-muted)]">{unit}</span>}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full accent-[var(--color-sand)]"
        aria-valuetext={`${value} ${unit ?? ""}`}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-[var(--color-text-secondary)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-control)] bg-[var(--color-surface)] px-3 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm text-[var(--color-text-secondary)]">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-control)] bg-[var(--color-surface)] px-3 text-sm"
      />
    </div>
  );
}

export function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-[var(--radius-md)] border border-[var(--color-divider)]" open>
      <summary className="flex h-11 cursor-pointer list-none items-center px-3 text-sm font-semibold">
        {title}
      </summary>
      <div className="flex flex-col gap-4 border-t border-[var(--color-divider)] p-3">{children}</div>
    </details>
  );
}
