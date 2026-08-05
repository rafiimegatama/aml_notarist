"use client";

import { useId, useState } from "react";
import Link from "next/link";
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
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Klien Sudah Pernah Terdaftar?
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Cek dulu dengan No. HP/Telepon atau No. Identitas/NPWP — kalau
        ditemukan, formulir CDD baru bisa langsung terisi dari data
        sebelumnya.
      </p>
      <form onSubmit={handleSearch} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label htmlFor={inputId} className="block text-xs font-medium text-gray-500">
            No. HP/Telepon atau No. Identitas/NPWP
          </label>
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="mis. 081234567890 atau 3201xxxxxxxxxxxx"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={searching || query.trim().length < 4}
          className="rounded-md bg-gray-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {searching ? "Mencari..." : "Cari"}
        </button>
      </form>

      {searched && !searching && results.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          Tidak ditemukan data yang cocok — silakan pilih jenis formulir baru
          di bawah.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-200">
          {results.map((r) => (
            <li key={r.customerId} className="flex items-center justify-between gap-4 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{r.displayName}</p>
                <p className="text-xs text-gray-500">
                  {customerTypeLabels[r.type]} · Cocok pada {r.matchedOn} ·{" "}
                  {customerStatusLabels[r.status]}
                </p>
              </div>
              <Link
                href={`${NEW_CDD_ROUTE[r.type]}?prefillFromCustomerId=${r.customerId}`}
                className="shrink-0 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
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
