"use client";

import { useState } from "react";
import { AlertCircle, TriangleAlert } from "lucide-react";
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
    <section
      className={
        "card p-6 sm:p-7 " +
        (isLtkm ? "border-danger-subtle bg-danger-subtle/30" : "")
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
            (isLtkm ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-brand-subtle text-brand-hover")
          }
        >
          <TriangleAlert className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Pelaporan LTKM
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">
            FR-8 — tandai pengguna jasa ini sebagai Laporan Transaksi Keuangan
            Mencurigakan (LTKM) untuk membantu menyiapkan submission manual ke
            PPATK (goAML). Bukan integrasi goAML otomatis (lihat FR-10).
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="ltkm-notes"
          className="block text-sm font-semibold text-slate-700"
        >
          Catatan (alasan/konteks)
        </label>
        <textarea
          id="ltkm-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-soft-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="Alasan/konteks penandaan LTKM..."
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
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
          <TriangleAlert className="h-4 w-4" strokeWidth={2} />
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

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#b91c1c]">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}
    </section>
  );
}
