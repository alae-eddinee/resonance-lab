"use client";

import { useSyncExternalStore } from "react";
import type { DecodedAudio } from "./decode";

export interface SharedAudioSelection {
  audio: DecodedAudio;
  fileName: string;
  startS: number;
  endS: number;
}

let current: SharedAudioSelection | null = null;
const listeners = new Set<() => void>();

export function setSharedAudioSelection(selection: SharedAudioSelection | null): void {
  current = selection;
  for (const listener of listeners) listener();
}

export function getSharedAudioSelection(): SharedAudioSelection | null {
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSharedAudioSelection(): SharedAudioSelection | null {
  return useSyncExternalStore(subscribe, getSharedAudioSelection, () => null);
}
