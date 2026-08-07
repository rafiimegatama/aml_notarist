"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CircleCheck,
  Download,
  HardDrive,
  LoaderCircle,
  Server,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  deleteOllamaModelAction,
  listOllamaModelsAction,
  setDefaultLocalModelAction,
  testProviderConnectionAction,
} from "@/lib/actions/aiSettings";
import type { OllamaModelInfo } from "@/lib/ai/provider";

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

type PullProgress = { status: string; completed?: number; total?: number; error?: string };

export function OllamaModelManager({ currentModel }: { currentModel: string }) {
  const { toast } = useToast();
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [models, setModels] = useState<OllamaModelInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newModelName, setNewModelName] = useState("");
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    setError(null);
    const health = await testProviderConnectionAction("ollama");
    setOllamaOnline(health.healthy);
    if (!health.healthy) {
      setModels([]);
      return;
    }
    const result = await listOllamaModelsAction();
    if (result.success) {
      setModels(result.models);
    } else {
      setError(result.error);
      setModels([]);
    }
  }

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, []);

  async function handlePull() {
    const model = newModelName.trim();
    if (!model) return;
    setPullProgress({ status: "Memulai unduhan..." });
    try {
      const res = await fetch("/api/ai/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      if (!res.body) throw new Error("Tidak ada respons stream dari server.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const progress = JSON.parse(line) as PullProgress;
            setPullProgress(progress);
          } catch {
            // lewati baris yang tidak lengkap
          }
        }
      }
      const downloadedModel = model;
      setPullProgress(null);
      setNewModelName("");
      refresh();
      toast({ variant: "success", title: "Model berhasil diunduh", description: downloadedModel });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengunduh model.";
      setPullProgress({ status: "error", error: message });
      toast({ variant: "error", title: "Gagal mengunduh model", description: message });
    }
  }

  function confirmDelete() {
    const model = deleteTarget;
    if (!model) return;
    startTransition(async () => {
      const result = await deleteOllamaModelAction(model);
      setDeleteTarget(null);
      if (!result.success) {
        setError(result.error);
        toast({ variant: "error", title: "Gagal menghapus model", description: result.error });
      } else {
        toast({ variant: "success", title: "Model dihapus", description: model });
      }
      refresh();
    });
  }

  function handleSetDefault(model: string) {
    startTransition(async () => {
      await setDefaultLocalModelAction(model);
      refresh();
      toast({ variant: "info", title: "Model default diperbarui", description: model });
    });
  }

  const pullPercent =
    pullProgress?.total && pullProgress.completed
      ? Math.round((pullProgress.completed / pullProgress.total) * 100)
      : null;

  return (
    <div className="card p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <Server className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Manajemen Model Ollama</h2>
            <p className="mt-1 text-sm font-medium text-muted">
              Model dan status server Ollama lokal (dijalankan lewat CLI: <code>ollama serve</code>).
            </p>
          </div>
        </div>
        {ollamaOnline !== null && (
          <Badge tone={ollamaOnline ? "success" : "danger"}>{ollamaOnline ? "Running" : "Offline"}</Badge>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger-subtle bg-danger-subtle/40 px-3.5 py-2.5 text-sm font-medium text-[#b91c1c]">
          {error}
        </div>
      )}

      {ollamaOnline === false && (
        <div className="mt-5">
          <EmptyState
            icon={Server}
            title="Ollama tidak dapat dijangkau"
            description="Pastikan `ollama serve` berjalan di mesin ini, lalu klik Segarkan. Base URL diatur di bagian Provider Lokal di atas."
            action={
              <button type="button" onClick={refresh} className="btn btn-secondary px-4 py-2 text-sm">
                Segarkan
              </button>
            }
          />
        </div>
      )}

      {ollamaOnline && (
        <>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="mis. qwen2.5vl, llava, gemma3, mistral, phi4"
              className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              disabled={!!pullProgress}
            />
            <button
              type="button"
              onClick={handlePull}
              disabled={!newModelName.trim() || !!pullProgress}
              className="btn btn-primary px-4 py-2.5 text-sm"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              Unduh Model
            </button>
          </div>

          {pullProgress && (
            <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {pullProgress.error ? (
                  <span className="text-[#b91c1c]">{pullProgress.error}</span>
                ) : (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin text-brand" strokeWidth={2} />
                    {pullProgress.status}
                    {pullPercent !== null && <span className="tabular-nums text-muted">— {pullPercent}%</span>}
                  </>
                )}
              </div>
              {pullPercent !== null && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${pullPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            {models === null ? (
              <p className="text-sm font-medium text-muted">Memuat model...</p>
            ) : models.length === 0 ? (
              <EmptyState
                icon={HardDrive}
                title="Belum ada model terpasang"
                description="Unduh model di atas untuk mulai — mis. `qwen2.5vl` (vision) atau `mistral` (teks)."
              />
            ) : (
              <div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle">
                {models.map((m) => (
                  <div key={m.name} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                        {m.name === currentModel && <Badge tone="brand">Default</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-muted">
                        {formatBytes(m.sizeBytes)}
                        {m.parameterSize ? ` · ${m.parameterSize}` : ""}
                        {m.quantization ? ` · ${m.quantization}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {m.name !== currentModel && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(m.name)}
                          disabled={isPending}
                          aria-label={`Jadikan ${m.name} model default`}
                          title="Jadikan model default"
                          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-brand-subtle hover:text-brand-hover disabled:opacity-50"
                        >
                          <Star className="h-4 w-4" strokeWidth={2} />
                        </button>
                      )}
                      {m.name === currentModel && (
                        <span className="rounded-full p-1.5 text-[#15803d]" title="Model default saat ini">
                          <CircleCheck className="h-4 w-4" strokeWidth={2} />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(m.name)}
                        disabled={isPending}
                        aria-label={`Hapus ${m.name}`}
                        title="Hapus model"
                        className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-danger-subtle hover:text-[#b91c1c] disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Hapus model "${deleteTarget}"?`}
        description="Model akan dihapus dari disk lokal. Anda perlu mengunduhnya ulang untuk memakainya lagi."
        confirmLabel="Hapus Model"
        tone="danger"
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
