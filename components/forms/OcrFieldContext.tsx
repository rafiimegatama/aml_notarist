"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FieldGuesses } from "@/lib/ocr/extractFields";

type OcrFieldContextValue = {
  guesses: FieldGuesses;
  confirmedPaths: Set<string>;
  confirm: (path: string) => void;
  confirmAll: () => void;
};

const OcrFieldContext = createContext<OcrFieldContextValue | null>(null);

/** FR-3 — bungkus form CDD yang punya ocrDraft supaya tiap field bisa tahu status OCR-nya sendiri (three-state) tanpa prop-drilling manual. */
export function OcrFieldProvider({
  guesses,
  children,
}: {
  guesses: FieldGuesses;
  children: ReactNode;
}) {
  const [confirmedPaths, setConfirmedPaths] = useState<Set<string>>(
    () => new Set()
  );

  const confirm = useCallback((path: string) => {
    setConfirmedPaths((prev) => {
      if (prev.has(path)) return prev;
      const next = new Set(prev);
      next.add(path);
      return next;
    });
  }, []);

  const confirmAll = useCallback(() => {
    setConfirmedPaths(new Set(Object.keys(guesses)));
  }, [guesses]);

  const value = useMemo(
    () => ({ guesses, confirmedPaths, confirm, confirmAll }),
    [guesses, confirmedPaths, confirm, confirmAll]
  );

  return (
    <OcrFieldContext.Provider value={value}>
      {children}
    </OcrFieldContext.Provider>
  );
}

export type OcrFieldState = {
  state: "suggested" | "confirmed";
  confidence: number | null;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
  onFocus: () => void;
};

/** Dipakai TextField/TextAreaField lewat prop `ocrPath` — null kalau tidak ada Provider di atasnya atau path tidak punya guess. */
export function useOcrFieldState(path?: string): OcrFieldState | null {
  const ctx = useContext(OcrFieldContext);
  if (!ctx || !path) return null;
  const guess = ctx.guesses[path];
  if (!guess) return null;
  const confirmed = ctx.confirmedPaths.has(path);
  return {
    state: confirmed ? "confirmed" : "suggested",
    confidence: guess.confidence,
    bbox: guess.bbox,
    onFocus: () => ctx.confirm(path),
  };
}

/** Dipakai OcrReviewGate — daftar path yang masih "Suggested — unverified" saat submit. */
export function useOcrUnverifiedPaths(): {
  unverifiedPaths: string[];
  confirmAll: () => void;
} | null {
  const ctx = useContext(OcrFieldContext);
  if (!ctx) return null;
  const unverifiedPaths = Object.keys(ctx.guesses).filter(
    (p) => !ctx.confirmedPaths.has(p)
  );
  return { unverifiedPaths, confirmAll: ctx.confirmAll };
}
