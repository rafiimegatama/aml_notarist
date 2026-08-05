"use client";

import { useState } from "react";
import { setLtkmFlag } from "@/lib/actions/ltkm";

export function LtkmPanel({
  customerId,
  initialIsLtkm,
  initialNotes,
}: {
  customerId: string;
  initialIsLtkm: boolean;
  initialNotes: string | null;
}) {
  const [isLtkm, setIsLtkm] = useState(initialIsLtkm);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const nextIsLtkm = !isLtkm;
    setPending(true);
    setError(null);
    try {
      await setLtkmFlag(customerId, nextIsLtkm, notes);
      setIsLtkm(nextIsLtkm);
    } catch {
      setError("Gagal menyimpan status LTKM. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  async function handleSaveNotes() {
    setPending(true);
    setError(null);
    try {
      await setLtkmFlag(customerId, isLtkm, notes);
    } catch {
      setError("Gagal menyimpan catatan LTKM. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Pelaporan LTKM</h2>
      <p className="mt-1 text-sm text-gray-500">
        FR-8 — tandai pengguna jasa ini sebagai Laporan Transaksi Keuangan
        Mencurigakan (LTKM) untuk membantu menyiapkan submission manual ke
        PPATK (goAML). Bukan integrasi goAML otomatis (lihat FR-10).
      </p>

      <div className="mt-4">
        <label
          htmlFor="ltkm-notes"
          className="block text-xs font-medium text-gray-500"
        >
          Catatan (alasan/konteks)
        </label>
        <textarea
          id="ltkm-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          placeholder="Alasan/konteks penandaan LTKM..."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className={
            isLtkm
              ? "btn btn-secondary px-4 py-2 text-sm"
              : "btn btn-danger px-4 py-2 text-sm"
          }
        >
          {pending
            ? "Menyimpan..."
            : isLtkm
              ? "Batalkan Tanda LTKM"
              : "Tandai sebagai LTKM"}
        </button>
        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={pending}
          className="btn btn-secondary px-4 py-2 text-sm"
        >
          Simpan Catatan
        </button>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
