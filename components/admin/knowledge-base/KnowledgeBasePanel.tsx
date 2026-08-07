"use client";

import { useState, useTransition } from "react";
import { BookMarked, FileText, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { addKnowledgeDocument, deleteKnowledgeDocument } from "@/lib/actions/knowledgeBase";
import { SOURCE_TYPES, type SourceType } from "@/lib/knowledgeBaseTypes";

const SOURCE_LABEL: Record<SourceType, string> = {
  PPATK: "Pedoman PPATK",
  UU_TPPU: "UU TPPU",
  SOP_INTERNAL: "SOP Internal Kantor",
  CDD_GUIDELINE: "Pedoman CDD",
  EDD_GUIDELINE: "Pedoman EDD",
  UPLOADED_REGULATION: "Regulasi Lainnya",
};

export interface KnowledgeDocumentRow {
  id: string;
  title: string;
  sourceType: string;
  createdAt: Date;
  chunkCount: number;
}

export function KnowledgeBasePanel({ initialDocuments }: { initialDocuments: KnowledgeDocumentRow[] }) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState(initialDocuments);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("SOP_INTERNAL");
  const [text, setText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocumentRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await addKnowledgeDocument(title, sourceType, text);
      if (!result.success) {
        toast({ variant: "error", title: "Gagal menambah dokumen", description: result.error });
        return;
      }
      toast({ variant: "success", title: "Dokumen ditambahkan ke Knowledge Base", description: title });
      setTitle("");
      setText("");
      setDocuments((prev) => [
        { id: result.documentId, title, sourceType, createdAt: new Date(), chunkCount: 0 },
        ...prev,
      ]);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteKnowledgeDocument(deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast({ variant: "success", title: "Dokumen dihapus", description: deleteTarget.title });
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Tambah Sumber Regulasi</h2>
            <p className="mt-1 text-sm font-medium text-muted">
              Tempel teks regulasi/SOP — AI Compliance Assistant HANYA boleh menjawab berdasarkan teks yang ada di
              sini, tidak pernah dari memori model (lihat halaman Case untuk tanya-jawab).
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-muted">Judul Dokumen</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Pedoman PPATK 2024"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted">Jenis Sumber</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as SourceType)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SOURCE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-muted">Isi Teks Regulasi</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Tempel isi regulasi/SOP di sini. Gunakan penanda 'Pasal 1', 'Section 5.3', dsb di awal paragraf supaya sitasi otomatis lebih akurat."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !title.trim() || !text.trim()}
          className="btn btn-primary mt-4 px-4 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Tambah ke Knowledge Base
        </button>
      </div>

      <div className="card p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <BookMarked className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Dokumen Tersimpan</h2>
            <p className="mt-1 text-sm font-medium text-muted">{documents.length} dokumen dalam Knowledge Base.</p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={FileText}
              title="Knowledge Base masih kosong"
              description="AI Compliance Assistant tidak akan bisa menjawab pertanyaan regulasi sampai ada dokumen di sini."
            />
          </div>
        ) : (
          <div className="mt-5 divide-y divide-border-subtle rounded-2xl border border-border-subtle">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{doc.title}</p>
                    <Badge tone="brand">{SOURCE_LABEL[doc.sourceType as SourceType] ?? doc.sourceType}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    {doc.chunkCount > 0 ? `${doc.chunkCount} bagian` : "baru ditambahkan"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(doc)}
                  aria-label={`Hapus ${doc.title}`}
                  className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-danger-subtle hover:text-[#b91c1c]"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Hapus "${deleteTarget?.title}"?`}
        description="AI Compliance Assistant tidak akan bisa lagi mengutip dokumen ini setelah dihapus."
        confirmLabel="Hapus Dokumen"
        tone="danger"
        pending={isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
