"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/ParameterField";
import { saveExperiment, saveMediaBlob } from "@/lib/experiments/db";
import { validateExperimentRecord } from "@/lib/validation/schemas";
import { generateId } from "@/lib/utils";
import type { ExperimentRecord } from "@/lib/experiments/types";

type PartialRecord = Pick<
  ExperimentRecord,
  "sourceType" | "evidenceCategories" | "plateConfig" | "activeModeIds" | "measurements" | "audioMeta"
> & {
  sourceDetails?: ExperimentRecord["sourceDetails"];
};

export function SaveExperimentButton({
  disabled,
  disabledReason,
  buildRecord,
  mediaBlob,
}: {
  disabled: boolean;
  disabledReason: string;
  buildRecord: () => PartialRecord;
  /** When provided, saved alongside the record so the experiment can be replayed exactly as it ran. */
  mediaBlob?: Blob | null;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(() => `Experiment ${new Date().toLocaleString()}`);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    const now = new Date().toISOString();
    const partial = buildRecord();
    const id = generateId();

    let hasRetainedMedia = false;
    let sourceDetails = partial.sourceDetails;
    if (mediaBlob) {
      const mediaId = generateId();
      try {
        await saveMediaBlob({ id: mediaId, experimentId: id, kind: "audio", blob: mediaBlob });
        hasRetainedMedia = true;
        sourceDetails = { ...sourceDetails, mediaId };
      } catch {
        // Media save failed; still save the rest of the record without it.
      }
    }

    const record: ExperimentRecord = {
      id,
      schemaVersion: 1,
      appVersion: "0.1.0",
      title,
      tags: [],
      notes: "",
      createdAt: now,
      updatedAt: now,
      hasRetainedMedia,
      ...partial,
      sourceDetails,
    };
    const result = validateExperimentRecord(record);
    if (!result.success) {
      setStatus("error");
      return;
    }
    try {
      await saveExperiment(result.data);
      setStatus("saved");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 900);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <Button
        variant="primary"
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => setOpen(true)}
      >
        Save experiment
      </Button>
      {disabled && <span className="text-xs text-[var(--color-text-muted)]">{disabledReason}</span>}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-overlay)] p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Save experiment"
            className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-dialog)]"
          >
            <h2 className="mb-3 text-lg font-semibold">Save experiment</h2>
            <TextField label="Title" value={title} onChange={setTitle} />
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              {mediaBlob
                ? "Stored in this browser, including the audio, so you can replay this experiment exactly as it ran."
                : "Stored in this browser. Original audio/media is not included unless separately recorded."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="tertiary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={status === "saving" || title.trim().length === 0}>
                {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save"}
              </Button>
            </div>
            {status === "error" && (
              <p className="mt-2 text-sm text-[var(--color-danger)]">Could not save. Check the title and try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
