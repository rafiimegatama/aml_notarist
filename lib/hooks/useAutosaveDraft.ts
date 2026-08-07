"use client";

import { useEffect, useRef } from "react";

const DEBOUNCE_MS = 1200;

export interface AutosaveDraft<T> {
  savedAt: number;
  values: T;
}

/**
 * Debounced localStorage autosave for long CDD forms — recovers form state
 * after an accidental tab close/refresh (FR-brief "Auto Save"). Purely a UX
 * convenience: never blocks/fails the form itself if localStorage is
 * unavailable (private browsing, quota full, etc).
 */
export function useAutosaveDraft<T>(key: string, values: T, enabled: boolean): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        const draft: AutosaveDraft<T> = { savedAt: Date.now(), values };
        localStorage.setItem(key, JSON.stringify(draft));
      } catch {
        // localStorage penuh/tidak tersedia — draft otomatis bukan fitur
        // kritis, lewati diam-diam daripada mengganggu pengisian form.
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, JSON.stringify(values)]);
}

export function loadAutosaveDraft<T>(key: string): AutosaveDraft<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as AutosaveDraft<T>;
  } catch {
    return null;
  }
}

export function clearAutosaveDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // tidak fatal — draft basi paling buruk cuma tetap tersimpan
  }
}
