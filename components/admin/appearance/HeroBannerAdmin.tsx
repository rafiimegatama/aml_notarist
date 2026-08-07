"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Dropzone } from "@/components/ui/dropzone";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { deleteHeroImage, setHeroBannerEnabled, uploadHeroImage } from "@/lib/actions/heroSettings";
import type { HeroBannerSettings } from "@/lib/actions/heroSettings";

export function HeroBannerAdmin({ initial }: { initial: HeroBannerSettings }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState(initial);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial.enabled && initial.filename ? "/api/hero-image" : null
  );
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFilesSelected(files: File[]) {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadHeroImage(fd);
    setUploading(false);
    if (result.success) {
      setSettings((s) => ({ ...s, enabled: true }));
      setPreviewUrl(`/api/hero-image?t=${Date.now()}`);
      toast({ variant: "success", title: "Gambar hero berhasil diunggah", description: "Tampil langsung di Dashboard." });
    } else {
      toast({ variant: "error", title: "Gagal mengunggah gambar", description: result.error });
    }
  }

  function handleToggleEnabled(enabled: boolean) {
    setSettings((s) => ({ ...s, enabled }));
    startTransition(async () => {
      await setHeroBannerEnabled(enabled);
      toast({
        variant: "info",
        title: enabled ? "Hero banner diaktifkan" : "Hero banner dinonaktifkan",
      });
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteHeroImage();
      setSettings({ enabled: false, filename: null, mimeType: null });
      setPreviewUrl(null);
      setConfirmDelete(false);
      toast({ variant: "success", title: "Kembali ke tampilan default" });
    });
  }

  return (
    <div className="card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Hero Banner Dashboard</h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Gambar latar kartu sambutan di halaman Dashboard. Kosongkan untuk memakai tampilan gradasi default.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-2">
          <span className="text-sm font-semibold text-slate-700">Aktif</span>
          <input
            type="checkbox"
            checked={settings.enabled}
            disabled={!settings.filename || isPending}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
        </label>
      </div>

      {/* Preview */}
      <div className="relative mt-5 h-40 overflow-hidden rounded-2xl">
        <div
          className={
            settings.enabled && previewUrl
              ? "absolute inset-0 bg-cover bg-center"
              : "absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-hover"
          }
          style={settings.enabled && previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
        />
        {settings.enabled && previewUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/50 to-transparent" />
        )}
        <div className="relative flex h-full items-end p-4">
          <p className="text-sm font-bold text-white">Pratinjau — Selamat Pagi</p>
        </div>
      </div>

      <div className="mt-5">
        <Dropzone
          onFilesSelected={handleFilesSelected}
          accept="image/png,image/jpeg,image/webp"
          formatBadges={["PNG", "JPG", "WEBP"]}
          maxSizeLabel="Maks 8MB"
          label={uploading ? "Mengunggah..." : "Drag & drop gambar hero di sini"}
          description="atau klik untuk memilih dari komputer"
          disabled={uploading}
          className="min-h-[140px]"
        />
      </div>

      {settings.filename && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn btn-secondary px-4 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Kembalikan Default
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Kembalikan tampilan default?"
        description="Gambar hero yang sedang aktif akan dihapus permanen dari server dan Dashboard kembali memakai gradasi default."
        confirmLabel="Kembalikan Default"
        tone="danger"
        pending={isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
