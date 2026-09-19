"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  accept,
  label,
  onFile,
}: {
  accept: string;
  label: string;
  onFile: (file: File) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed p-8 text-center",
        dragOver ? "border-[var(--color-sand)] bg-[var(--color-surface-hover)]" : "border-[var(--color-divider)]",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      <UploadCloud className="h-8 w-8 text-[var(--color-text-muted)]" aria-hidden="true" />
      <label htmlFor={id} className="cursor-pointer text-sm font-medium text-[var(--color-sand)] underline">
        {label}
      </label>
      <p className="text-xs text-[var(--color-text-muted)]">or drag and drop a file here</p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
