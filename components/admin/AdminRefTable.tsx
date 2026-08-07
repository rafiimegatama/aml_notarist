"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Power, Plus, Users, Building2, MapPin, Globe, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  addRefScoreRow,
  updateRefScoreRow,
  setRefScoreRowActive,
} from "@/lib/actions/refData";
import type { RefTableKey } from "@/lib/refTableConfig";
import { Badge } from "@/components/ui/badge";

export type RefRow = {
  id: string;
  categoryName: string;
  score: number | null;
  isActive: boolean;
};

// Dipetakan dari tableKey (string, aman lintas RSC boundary) di dalam client
// component ini — komponen ikon (function) tidak bisa dikirim sebagai prop
// dari Server Component (app/admin/referensi/page.tsx) ke Client Component.
const TABLE_ICON: Record<RefTableKey, LucideIcon> = {
  userProfile: Users,
  businessSector: Building2,
  region: MapPin,
  country: Globe,
  notaryServiceType: Briefcase,
};

export function AdminRefTable({
  tableKey,
  label,
  note,
  scoreRequired,
  rows,
}: {
  tableKey: RefTableKey;
  label: string;
  note?: string;
  scoreRequired: boolean;
  rows: RefRow[];
}) {
  const Icon = TABLE_ICON[tableKey];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editScore, setEditScore] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newScore, setNewScore] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEmpty = rows.length === 0;

  function startEdit(row: RefRow) {
    setError(null);
    setEditingId(row.id);
    setEditCategoryName(row.categoryName);
    setEditScore(row.score != null ? String(row.score) : "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateRefScoreRow(tableKey, id, {
        categoryName: editCategoryName,
        score: editScore,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function toggleActive(row: RefRow) {
    if (
      row.isActive &&
      !window.confirm(
        `Nonaktifkan kategori "${row.categoryName}"? Kategori nonaktif tidak akan muncul sebagai pilihan skoring baru.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setRefScoreRowActive(
        tableKey,
        row.id,
        !row.isActive
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function addRow() {
    setError(null);
    startTransition(async () => {
      const result = await addRefScoreRow(tableKey, {
        categoryName: newCategoryName,
        score: newScore,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNewCategoryName("");
      setNewScore("");
      router.refresh();
    });
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle p-6 sm:p-7">
        <div className="flex items-start gap-3.5">
          {Icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">{label}</h2>
              {isEmpty && <Badge tone="warning">Perlu Dilengkapi</Badge>}
            </div>
            {note && (
              <p className="mt-1 text-sm font-medium text-[#b45309]">{note}</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-6 rounded-xl border border-danger-subtle bg-danger-subtle/40 px-3.5 py-2.5 text-sm font-medium text-[#b91c1c] sm:mx-7">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-slate-50/70 text-muted">
              <th className="px-6 py-3.5 font-semibold sm:px-7">Kategori</th>
              <th className="px-6 py-3.5 font-semibold sm:px-7">Skor</th>
              <th className="px-6 py-3.5 font-semibold sm:px-7">Status</th>
              <th className="px-6 py-3.5 text-right font-semibold sm:px-7">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                {editingId === row.id ? (
                  <>
                    <td className="px-6 py-3 sm:px-7">
                      <input
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-3 sm:px-7">
                      <input
                        className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        inputMode="numeric"
                      />
                    </td>
                    <td className="px-6 py-3 sm:px-7">
                      <Badge tone={row.isActive ? "success" : "neutral"}>
                        {row.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 sm:px-7">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => saveEdit(row.id)}
                          className="btn btn-primary px-2.5 py-1.5 text-xs disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="btn btn-ghost px-2.5 py-1.5 text-xs"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                          Batal
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-3 font-medium text-slate-900 sm:px-7">
                      {row.categoryName}
                    </td>
                    <td className="px-6 py-3 tabular-nums text-slate-700 sm:px-7">
                      {row.score ?? "—"}
                    </td>
                    <td className="px-6 py-3 sm:px-7">
                      <Badge tone={row.isActive ? "success" : "neutral"}>
                        {row.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 sm:px-7">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="btn btn-ghost px-2.5 py-1.5 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => toggleActive(row)}
                          className="btn btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-50"
                        >
                          <Power className="h-3.5 w-3.5" strokeWidth={2} />
                          {row.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted sm:px-7">
                  Belum ada kategori.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border-subtle p-6 sm:p-7">
        <div className="flex-1">
          <label
            htmlFor={`${tableKey}-new-category`}
            className="block text-xs font-semibold text-muted"
          >
            Kategori baru
          </label>
          <input
            id={`${tableKey}-new-category`}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>
        <div className="w-24">
          <label
            htmlFor={`${tableKey}-new-score`}
            className="block text-xs font-semibold text-muted"
          >
            Skor{!scoreRequired && " (opsional)"}
          </label>
          <input
            id={`${tableKey}-new-score`}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={addRow}
          className="btn btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Tambah
        </button>
      </div>
    </section>
  );
}
