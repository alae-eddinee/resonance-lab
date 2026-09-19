"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listExperiments } from "@/lib/experiments/db";
import type { ExperimentRecord } from "@/lib/experiments/types";

export function RecentExperiments() {
  const [records, setRecords] = useState<ExperimentRecord[] | null>(null);

  useEffect(() => {
    listExperiments()
      .then((all) => setRecords(all.slice(0, 3)))
      .catch(() => setRecords([]));
  }, []);

  if (records === null) return null;

  if (records.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)]">
        No saved experiments yet. <Link href="/experiments" className="text-[var(--color-violet)] underline">Open saved experiments</Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">Recent experiments</h2>
      <ul className="divide-y divide-[var(--color-divider)]">
        {records.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-3">
            <div>
              <Link href={`/experiments?open=${r.id}`} className="text-sm font-medium hover:underline">
                {r.title}
              </Link>
              <p className="text-xs text-[var(--color-text-muted)]">{r.sourceType}</p>
            </div>
            <time className="text-xs text-[var(--color-text-muted)]" dateTime={r.updatedAt}>
              {new Date(r.updatedAt).toLocaleDateString()}
            </time>
          </li>
        ))}
      </ul>
      <Link href="/experiments" className="text-sm text-[var(--color-violet)] underline">
        View all saved experiments
      </Link>
    </div>
  );
}
