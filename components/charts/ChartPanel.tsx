import type { ReactNode } from "react";
import { EvidenceBadge, type EvidenceCategory } from "@/components/ui/EvidenceBadge";

export function ChartPanel({
  title,
  evidence,
  caption,
  children,
}: {
  title: string;
  evidence?: EvidenceCategory;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {evidence && <EvidenceBadge category={evidence} />}
      </div>
      {children}
      {caption && <p className="mt-2 text-xs text-[var(--color-text-muted)]">{caption}</p>}
    </section>
  );
}
