"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge, type EvidenceCategory } from "@/components/ui/EvidenceBadge";
import { ProcessedRunPlayer } from "@/components/plates/ProcessedRunPlayer";
import { listExperiments, deleteExperiment, saveExperiment, getMediaBlob } from "@/lib/experiments/db";
import { validateExperimentRecord } from "@/lib/validation/schemas";
import { useOfflineProcessing } from "@/hooks/useOfflineProcessing";
import { decodeAudioFile, type DecodedAudio } from "@/lib/audio/decode";
import type { ExperimentRecord } from "@/lib/experiments/types";
import { downloadJson, downloadCsv } from "@/lib/export/exporters";
import { Loader2 } from "lucide-react";

export default function ExperimentsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importError, setImportError] = useState<string | null>(null);

  const [replayId, setReplayId] = useState<string | null>(null);
  const [replayAudio, setReplayAudio] = useState<DecodedAudio | null>(null);
  const [replayError, setReplayError] = useState<string | null>(null);
  const offline = useOfflineProcessing();

  async function refresh() {
    setLoading(true);
    const all = await listExperiments();
    setRecords(all);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch-on-mount pattern: the initial setLoading(true) inside refresh()
    // runs synchronously, which this rule otherwise flags as a state cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    await deleteExperiment(id);
    if (replayId === id) {
      setReplayId(null);
      setReplayAudio(null);
      offline.reset();
    }
    await refresh();
  }

  async function handleImport(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = validateExperimentRecord({ ...data, id: `${data.id}-import-${Date.now()}` });
      if (!result.success) {
        setImportError("Invalid experiment file: schema validation failed.");
        return;
      }
      await saveExperiment(result.data);
      await refresh();
    } catch {
      setImportError("Could not read this file as a Resonance Lab experiment export.");
    }
  }

  function compareSelected() {
    router.push(`/compare?ids=${Array.from(selected).join(",")}`);
  }

  async function handleReplay(record: ExperimentRecord) {
    setReplayError(null);
    if (replayId === record.id) {
      setReplayId(null);
      setReplayAudio(null);
      offline.reset();
      return;
    }
    const mediaId = record.sourceDetails?.mediaId;
    if (!mediaId || !record.plateConfig) return;
    setReplayId(record.id);
    setReplayAudio(null);
    offline.reset();
    const media = await getMediaBlob(mediaId);
    if (!media) {
      setReplayError("The recorded audio for this experiment is no longer available in this browser.");
      setReplayId(null);
      return;
    }
    try {
      const decoded = await decodeAudioFile(media.blob);
      setReplayAudio(decoded);
      const startS = record.sourceDetails?.startS ?? 0;
      const endS = record.sourceDetails?.endS ?? decoded.durationS;
      await offline.process(record.plateConfig, decoded, startS, endS);
    } catch {
      setReplayError("Could not decode the saved audio for replay.");
      setReplayId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Saved Experiments"
        description="Find, reopen, duplicate, import, and export local records."
        actions={
          <div className="flex gap-2">
            <label className="inline-flex h-11 cursor-pointer items-center rounded-[var(--radius-sm)] border border-[var(--color-border-control)] bg-[var(--color-surface-raised)] px-4 text-sm font-semibold">
              Import
              <input
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                }}
              />
            </label>
            <Button
              variant="secondary"
              onClick={() => downloadJson(records, "resonance-lab-experiments")}
              disabled={records.length === 0}
            >
              Export all
            </Button>
            <Button variant="primary" onClick={compareSelected} disabled={selected.size < 2}>
              Compare selected ({selected.size})
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {importError && <p className="mb-3 text-sm text-[var(--color-danger)]">{importError}</p>}

        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No saved experiments yet. Start a session on Live Cymatics, Audio Laboratory, or Plate Simulator, then
            Save experiment.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-divider)] rounded-[var(--radius-md)] border border-[var(--color-divider)]">
            {records.map((record) => (
              <li key={record.id} className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(record.id)}
                      onChange={() => toggleSelect(record.id)}
                      className="mt-1 h-5 w-5"
                      aria-label={`Select ${record.title}`}
                    />
                    <div>
                      <p className="font-medium">{record.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {record.sourceType} · {new Date(record.updatedAt).toLocaleString()}
                        {record.hasRetainedMedia && " · audio saved"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {record.evidenceCategories.map((c) => (
                          <EvidenceBadge key={c} category={c as EvidenceCategory} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {record.hasRetainedMedia && record.sourceDetails?.mediaId && (
                      <Button
                        variant={replayId === record.id ? "secondary" : "primary"}
                        onClick={() => handleReplay(record)}
                      >
                        {replayId === record.id ? "Close replay" : "Replay"}
                      </Button>
                    )}
                    <Button variant="tertiary" onClick={() => downloadJson(record, record.title)}>
                      Export JSON
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={() =>
                        downloadCsv(
                          Object.entries(record.measurements).map(([metric, value]) => ({ metric, value })),
                          `${record.title}-metrics`,
                        )
                      }
                    >
                      Export CSV
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(record.id)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {replayId === record.id && (
                  <div className="border-t border-[var(--color-divider)] pt-3">
                    {offline.status === "processing" && (
                      <p className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Loader2 className="h-4 w-4 animate-spin" /> Reprocessing saved audio…{" "}
                        {Math.round(offline.progress * 100)}%
                      </p>
                    )}
                    {replayError && <p className="text-sm text-[var(--color-danger)]">{replayError}</p>}
                    {replayAudio && offline.status === "done" && offline.run && (
                      <ProcessedRunPlayer
                        audio={replayAudio}
                        startS={0}
                        endS={replayAudio.durationS}
                        run={offline.run}
                        viewMode="particles"
                        evidence="measured-audio"
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Clearing browser storage or using private browsing can remove local experiments. No account, sync, or cloud
          storage is used.
        </p>
      </div>
    </div>
  );
}
