import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--color-sand)] text-[var(--color-ink-on-accent)] hover:bg-[var(--color-sand-hover)] active:bg-[var(--color-sand-pressed)]",
        variant === "secondary" &&
          "border border-[var(--color-border-control)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
        variant === "tertiary" && "text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
        variant === "destructive" &&
          "text-[var(--color-danger)] hover:bg-[var(--color-surface-hover)]",
        className,
      )}
      {...props}
    />
  );
}
