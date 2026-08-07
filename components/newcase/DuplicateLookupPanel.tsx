"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  findPotentialDuplicates,
  type DuplicateCandidate,
} from "@/lib/actions/duplicateLookup";
import { CustomerType } from "@/lib/generated/prisma/enums";
import { customerTypeLabels, customerStatusLabels } from "@/lib/labels";

const NEW_CDD_ROUTE: Record<CustomerType, string> = {
  KORPORASI: "/cdd/new/korporasi",
  PERORANGAN: "/cdd/new/perorangan",
  LEGAL_ARRANGEMENT: "/cdd/new/perikatan-lainnya",
};

// FR-9 (evolved) — sebelum membuat CDD dari nol, cek dulu apakah klien ini
// sudah pernah terdaftar (lewat No. HP/Telepon atau No. Identitas/NPWP).
// Kalau ketemu, notaris bisa lompat ke form yang sudah terisi data lama,
// bukan mengetik ulang. Kalau tidak ketemu (atau tidak dicari sama sekali),
// tiga pilihan jenis CDD di bawah tetap tersedia seperti biasa.
export function DuplicateLookupPanel() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<DuplicateCandidate[]>([]);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (query.trim().length < 4) return;
    setSearching(true);
    const found = await findPotentialDuplicates(query);
    setResults(found);
    setSearched(true);
    setSearching(false);
  }

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <Search className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Klien Sudah Pernah Terdaftar?
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Cek dulu dengan No. HP/Telepon atau No. Identitas/NPWP — kalau
            ditemukan, formulir CDD baru bisa langsung terisi dari data
            sebelumnya.
          </p>
        </div>
      </div>
      <form onSubmit={handleSearch} className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor={inputId} className="block text-xs font-semibold text-muted">
            No. HP/Telepon atau No. Identitas/NPWP
          </label>
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="mis. 081234567890 atau 3201xxxxxxxxxxxx"
            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-soft-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <button
          type="submit"
          disabled={searching || query.trim().length < 4}
          className="btn btn-primary px-4 py-2.5 text-sm"
        >
          {searching ? "Mencari..." : "Cari"}
        </button>
      </form>

      {searched && !searching && results.length === 0 && (
        <p className="mt-4 text-sm font-medium text-muted">
          Tidak ditemukan data yang cocok — silakan pilih jenis formulir baru
          di bawah.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-5 space-y-2.5">
          {results.map((r) => (
            <li
              key={r.customerId}
              className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-canvas p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{r.displayName}</p>
                <p className="mt-0.5 text-xs font-medium text-muted">
                  {customerTypeLabels[r.type]} · Cocok pada {r.matchedOn} ·{" "}
                  {customerStatusLabels[r.status]}
                </p>
              </div>
              <Link
                href={`${NEW_CDD_ROUTE[r.type]}?prefillFromCustomerId=${r.customerId}`}
                className="btn btn-secondary shrink-0 px-3.5 py-1.5 text-sm"
              >
                Gunakan data ini
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
