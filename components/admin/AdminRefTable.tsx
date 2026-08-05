"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addRefScoreRow,
  updateRefScoreRow,
  setRefScoreRowActive,
} from "@/lib/actions/refData";
import type { RefTableKey } from "@/lib/refTableConfig";

export type RefRow = {
  id: string;
  categoryName: string;
  score: number | null;
  isActive: boolean;
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
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
        {isEmpty && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Perlu Dilengkapi
          </span>
        )}
      </div>
      {note && <p className="mt-1 text-sm text-amber-700">{note}</p>}

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 pr-4 font-medium">Kategori</th>
              <th className="py-2 pr-4 font-medium">Skor</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                {editingId === row.id ? (
                  <>
                    <td className="py-2 pr-4">
                      <input
                        className="w-full rounded border border-gray-300 px-2 py-1"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        className="w-20 rounded border border-gray-300 px-2 py-1"
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        inputMode="numeric"
                      />
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {row.isActive ? "Aktif" : "Nonaktif"}
                    </td>
                    <td className="py-2 space-x-3">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => saveEdit(row.id)}
                        className="text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-gray-500 hover:underline"
                      >
                        Batal
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-4 text-gray-900">
                      {row.categoryName}
                    </td>
                    <td className="py-2 pr-4 text-gray-900">
                      {row.score ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          row.isActive
                            ? "text-green-700"
                            : "text-gray-400"
                        }
                      >
                        {row.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-2 space-x-3">
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => toggleActive(row)}
                        className="text-gray-600 hover:underline disabled:opacity-50"
                      >
                        {row.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-gray-500">
                  Belum ada kategori.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-end gap-3 border-t border-gray-100 pt-4">
        <div className="flex-1">
          <label
            htmlFor={`${tableKey}-new-category`}
            className="block text-xs font-medium text-gray-500"
          >
            Kategori baru
          </label>
          <input
            id={`${tableKey}-new-category`}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>
        <div className="w-24">
          <label
            htmlFor={`${tableKey}-new-score`}
            className="block text-xs font-medium text-gray-500"
          >
            Skor{!scoreRequired && " (opsional)"}
          </label>
          <input
            id={`${tableKey}-new-score`}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={addRow}
          className="btn btn-primary px-4 py-1.5 text-sm"
        >
          Tambah
        </button>
      </div>
    </section>
  );
}
