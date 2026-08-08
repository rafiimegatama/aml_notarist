"use client";

import { useEffect, useRef, useState } from "react";
import { findPotentialDuplicates, type DuplicateCandidate } from "@/lib/actions/duplicateLookup";
import type { CustomerType } from "@/lib/generated/prisma/enums";

const DEBOUNCE_MS = 600;
// Angka mentah minimal sebelum dianggap layak dicari — di bawah ini terlalu
// banyak false-positive dari NIK/NPWP yang baru separuh diketik.
const MIN_DIGITS = 6;

/**
 * Auto-detect "klien ini sudah pernah terdaftar?" langsung dari field
 * NPWP/No. Identitas yang sedang diketik notaris di formulir CDD — beda
 * dari DuplicateLookupPanel (kotak pencarian terpisah di halaman "CDD
 * Baru"), ini reaktif terhadap field form itu sendiri. Reuse
 * findPotentialDuplicates() apa adanya (FR-9) — tidak ada Server Action
 * baru, hanya wiring client baru. Tidak pernah mengisi form secara diam-diam
 * — hanya mengembalikan kandidat, caller yang memutuskan menampilkan
 * banner konfirmasi (lihat DuplicateFieldBanner) dan memanggil setValue/
 * reset() sendiri saat notaris klik "Isi Otomatis" — pola human-in-the-loop
 * yang sama dengan review OCR (FR-3).
 */
export function useDuplicateFieldMatch(
  value: string,
  customerType: CustomerType,
  enabled: boolean
) {
  const [candidate, setCandidate] = useState<DuplicateCandidate | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const digitsOnly = (value ?? "").replace(/\D/g, "");
    const shouldSearch = enabled && digitsOnly.length >= MIN_DIGITS && value !== dismissedFor;

    // Semua setCandidate() sengaja dijalankan di dalam setTimeout (bukan
    // langsung di badan effect) supaya tidak memicu cascading render —
    // termasuk jalur "clear" (delay 0ms), bukan cuma jalur pencarian.
    timeoutRef.current = setTimeout(
      () => {
        if (!shouldSearch) {
          setCandidate(null);
          return;
        }
        void (async () => {
          const results = await findPotentialDuplicates(value);
          setCandidate(results.find((r) => r.type === customerType) ?? null);
        })();
      },
      shouldSearch ? DEBOUNCE_MS : 0
    );

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, customerType, enabled, dismissedFor]);

  function dismiss() {
    setDismissedFor(value);
    setCandidate(null);
  }

  return { candidate, dismiss };
}
