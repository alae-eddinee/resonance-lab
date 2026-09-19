"use client";

import { useEffect, useState } from "react";
import { estimateStorageUsage } from "@/lib/experiments/db";

export function LocalStorageStatus() {
  const [usage, setUsage] = useState<{ usageBytes: number; quotaBytes: number } | null>(null);

  useEffect(() => {
    estimateStorageUsage().then(setUsage).catch(() => setUsage(null));
  }, []);

  return (
    <div className="text-xs text-[var(--color-text-muted)]">
      <p>Stored in this browser only.</p>
      {usage && usage.quotaBytes > 0 && (
        <p className="mt-1 tabular-nums">
          ~{(usage.usageBytes / 1_048_576).toFixed(1)} MB of {(usage.quotaBytes / 1_048_576).toFixed(0)} MB
          (estimated)
        </p>
      )}
    </div>
  );
}
