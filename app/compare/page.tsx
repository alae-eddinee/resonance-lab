"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlateViewport } from "@/components/plates/PlateViewport";
import { EvidenceBadge, type EvidenceCategory } from "@/components/ui/EvidenceBadge";
import { getExperiment } from "@/lib/experiments/db";
import { computeModes } from "@/lib/physics/plateModes";
import { renderDisplacementField, estimateSandDensity } from "@/lib/simulation/modalField";
import type { ExperimentRecord } from "@/lib/experiments/types";
import { formatHz } from "@/lib/utils";

function CompareContent() {
  const params = useSearchParams();
  const ids = useMemo(() => (params.get("ids") ?? "").split(",").filter(Boolean).slice(0, 4), [params]);
  const [records, setRecords] = useState<Array<ExperimentRecord | null>>([]);

  useEffect(() => {
    Promise.all(ids.map((id) => getExperiment(id).then((r) => r ?? null))).then(setRecords);
  }, [ids]);

  if (ids.length === 0) {
    return (
      <p className="p-6 text-sm text-[var(--color-text-secondary)]">
        Select two to four saved experiments in Saved Experiments, then choose &ldquo;Compare selected&rdquo;.
      </p>
    );
  }

  const metricKeys = new Set<string>();
  for (const r of records) if (r) for (const k of Object.keys(r.measurements)) metricKeys.add(k);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-2 text-sm font-semibold">Comparability</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Source types: {records.map((r) => r?.sourceType ?? "unavailable").join(", ")}. Different evidence
          categories may be displayed side by side but are not given a shared numerical similarity score.
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${records.length > 2 ? "lg:grid-cols-2" : "md:grid-cols-2"}`}>
        {records.map((record, i) => (
          <div key={ids[i]} className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
            {record ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{record.title}</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">Slot {String.fromCharCode(65 + i)}</span>
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {record.evidenceCategories.map((c) => (
                    <EvidenceBadge key={c} category={c as EvidenceCategory} />
                  ))}
                </div>
                {record.plateConfig && <ComparePlatePreview config={record.plateConfig} activeModeIds={record.activeModeIds} />}
              </>
            ) : (
              <p className="text-sm text-[var(--color-danger)]">Record unavailable. Choose replacement in Saved Experiments.</p>
            )}
          </div>
        ))}
      </div>

      {metricKeys.size > 0 && (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-2 text-sm font-semibold">Measurement comparison</h3>
          <table className="w-full text-left text-sm">
            <thead className="text-[var(--color-text-muted)]">
              <tr>
                <th className="py-1 font-normal">Metric</th>
                {records.map((r, i) => (
                  <th key={i} className="py-1 font-normal">
                    {r?.title ?? "Unavailable"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(metricKeys).map((key) => (
                <tr key={key} className="border-t border-[var(--color-divider)]">
                  <td className="py-1">{key}</td>
                  {records.map((r, i) => (
                    <td key={i} className="py-1 tabular-nums">
                      {r && key in r.measurements ? r.measurements[key].toFixed(3) : "No measurement"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComparePlatePreview({
  config,
  activeModeIds,
}: {
  config: NonNullable<ExperimentRecord["plateConfig"]>;
  activeModeIds: string[];
}) {
  const modes = useMemo(() => computeModes(config), [config]);
  const field = useMemo(() => {
    const active = modes.filter((m) => activeModeIds.includes(m.id)).map((mode) => ({ mode, weight: 1 }));
    return renderDisplacementField(config, active, config.simulationResolution);
  }, [config, modes, activeModeIds]);
  const sand = useMemo(() => estimateSandDensity(field), [field]);

  return (
    <div>
      <PlateViewport
        shape={config.geometry.shape}
        resolution={config.simulationResolution}
        displacementField={field}
        sandDensity={sand}
        view="particles"
        frozen
        running={false}
        className="max-w-[320px]"
      />
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        {config.geometry.shape}, {(config.geometry.thicknessM * 1000).toFixed(2)} mm, {config.material.name}. Snapshot
        replay from saved active modes; not a re-run of the original source.
      </p>
      <table className="mt-2 w-full text-left text-xs">
        <tbody>
          {modes
            .filter((m) => activeModeIds.includes(m.id))
            .slice(0, 4)
            .map((m) => (
              <tr key={m.id} className="border-t border-[var(--color-divider)]">
                <td className="py-1">
                  m={m.m}, n={m.n}
                </td>
                <td className="py-1 tabular-nums">{formatHz(m.frequencyHz)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div>
      <PageHeader title="Compare Experiments" description="Compare compatible results and disclosed differences." />
      <Suspense fallback={<p className="p-6 text-sm text-[var(--color-text-muted)]">Loading…</p>}>
        <CompareContent />
      </Suspense>
    </div>
  );
}
