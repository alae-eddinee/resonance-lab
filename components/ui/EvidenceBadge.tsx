import { cn } from "@/lib/utils";
import { AudioWaveform, Atom, Lightbulb, Video } from "lucide-react";

export type EvidenceCategory =
  | "measured-audio"
  | "physics-simulation"
  | "educational-mapping"
  | "footage-measurement";

const CONFIG: Record<EvidenceCategory, { label: string; description: string; icon: typeof Atom }> = {
  "measured-audio": {
    label: "Measured audio",
    description: "Derived from the selected digital audio signal; microphone and device affect capture.",
    icon: AudioWaveform,
  },
  "physics-simulation": {
    label: "Physics simulation",
    description: "Computed under the displayed model, geometry, boundary, and excitation assumptions.",
    icon: Atom,
  },
  "educational-mapping": {
    label: "Educational mapping",
    description: "Illustrative transformation from sound features to a pattern; not a mechanical plate prediction.",
    icon: Lightbulb,
  },
  "footage-measurement": {
    label: "Footage measurement",
    description: "Estimates from the selected footage, region, processing settings, and calibration.",
    icon: Video,
  },
};

export function EvidenceBadge({ category, className }: { category: EvidenceCategory; className?: string }) {
  const { label, description, icon: Icon } = CONFIG[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--color-divider)] px-2 py-1 text-xs text-[var(--color-text-secondary)]",
        className,
      )}
      title={description}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
      <span className="sr-only">{description}</span>
    </span>
  );
}
