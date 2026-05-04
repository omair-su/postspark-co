import { useSyncExternalStore } from "react";

// Tiny global store to track active AI/long-running calls.
// Components can call begin()/end() around server-fn invocations
// and the navbar progress bar will animate.

let activeCount = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function beginAITask() {
  activeCount += 1;
  emit();
}

export function endAITask() {
  activeCount = Math.max(0, activeCount - 1);
  emit();
}

/** Wrap a promise so the global progress bar shows while it's pending. */
export async function withAIProgress<T>(p: Promise<T>): Promise<T> {
  beginAITask();
  try {
    return await p;
  } finally {
    endAITask();
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return activeCount;
}

function getServerSnapshot() {
  return 0;
}

export function useAIProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
