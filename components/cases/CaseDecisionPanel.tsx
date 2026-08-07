"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, ClipboardCheck, PlayCircle, ShieldCheck } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { decideCase, markCaseInProgress, toggleChecklistItem, type ChecklistKey } from "@/lib/actions/case";

const CHECKLIST_ITEMS: { key: ChecklistKey; label: string }[] = [
  { key: "identityVerified", label: "Identitas terverifikasi" },
  { key: "sourceOfFundsReviewed", label: "Sumber Dana ditinjau" },
  { key: "sourceOfWealthReviewed", label: "Sumber Kekayaan ditinjau" },
  { key: "beneficialOwnerConfirmed", label: "Pemilik Manfaat (BO) dikonfirmasi" },
  { key: "documentsVerified", label: "Dokumen pendukung terverifikasi" },
  { key: "aiRecommendationReviewed", label: "Rekomendasi AI sudah ditinjau" },
  { key: "regulationReviewed", label: "Regulasi terkait sudah ditinjau" },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  OCR_PROCESSING: "Proses OCR",
  RISK_ASSESSMENT: "Risk Assessment",
  NEED_REVIEW: "Perlu Ditinjau",
  EDD_REQUIRED: "EDD Diperlukan",
  EDD_IN_PROGRESS: "EDD Berlangsung",
  WAITING_MANUAL_REVIEW: "Menunggu Tinjauan Manual",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  ARCHIVED: "Diarsipkan",
};

const STATUS_TONE: Record<string, BadgeTone> = {
  APPROVED: "success",
  REJECTED: "danger",
  ARCHIVED: "neutral",
  WAITING_MANUAL_REVIEW: "brand",
};

type Outcome = "APPROVED" | "REJECTED" | "NEED_MORE_DOCUMENTS" | "ARCHIVED";

export function CaseDecisionPanel({
  caseId,
  status,
  initialChecklist,
  decision,
}: {
  caseId: string;
  status: string;
  initialChecklist: Record<ChecklistKey, boolean> | null;
  decision: { outcome: string; notes: string | null; decidedAt: Date } | null;
}) {
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>(
    initialChecklist ?? {
      identityVerified: false,
      sourceOfFundsReviewed: false,
      sourceOfWealthReviewed: false,
      beneficialOwnerConfirmed: false,
      documentsVerified: false,
      aiRecommendationReviewed: false,
      regulationReviewed: false,
    }
  );
  const [notes, setNotes] = useState("");
  const [pendingOutcome, setPendingOutcome] = useState<Outcome | null>(null);
  const [isPending, startTransition] = useTransition();

  const allChecked = CHECKLIST_ITEMS.every((item) => checklist[item.key]);
  const isDecided = !!decision;

  function handleToggle(key: ChecklistKey) {
    const next = !checklist[key];
    setChecklist((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      const result = await toggleChecklistItem(caseId, key, next);
      if (!result.success) {
        toast({ variant: "error", title: "Gagal menyimpan checklist", description: result.error });
        setChecklist((prev) => ({ ...prev, [key]: !next }));
      }
    });
  }

  function handleStartEdd() {
    startTransition(async () => {
      const result = await markCaseInProgress(caseId);
      if (!result.success) {
        toast({ variant: "error", title: "Gagal memulai EDD", description: result.error });
      } else {
        toast({ variant: "info", title: "EDD dimulai" });
        window.location.reload();
      }
    });
  }

  function handleDecide() {
    if (!pendingOutcome) return;
    startTransition(async () => {
      const result = await decideCase(caseId, pendingOutcome, notes);
      if (!result.success) {
        toast({ variant: "error", title: "Keputusan belum bisa disimpan", description: result.error });
        setPendingOutcome(null);
      } else {
        toast({ variant: "success", title: "Keputusan tercatat" });
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand-hover" strokeWidth={2} />
            <h3 className="text-sm font-bold text-slate-900">Status Case</h3>
          </div>
          <Badge tone={STATUS_TONE[status] ?? "warning"}>{STATUS_LABEL[status] ?? status}</Badge>
        </div>
        {status === "EDD_REQUIRED" && (
          <button type="button" onClick={handleStartEdd} disabled={isPending} className="btn btn-secondary mt-4 w-full px-4 py-2 text-sm">
            <PlayCircle className="h-4 w-4" strokeWidth={2} />
            Mulai EDD
          </button>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-hover" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">Manual Review Checklist</h3>
        </div>
        <p className="mt-1 text-xs font-medium text-muted">
          Wajib lengkap sebelum Approve/Reject — AI tidak pernah bisa mencentang item ini.
        </p>
        <div className="mt-4 space-y-2.5">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item.key} className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={checklist[item.key]}
                onChange={() => handleToggle(item.key)}
                disabled={isDecided}
                className="h-4 w-4 shrink-0 rounded accent-brand disabled:opacity-50"
              />
              {checklist[item.key] ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803d]" strokeWidth={2} />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
              )}
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-900">Keputusan</h3>
        {isDecided ? (
          <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-sm">
            <p className="font-bold text-slate-900">{STATUS_LABEL[decision!.outcome] ?? decision!.outcome}</p>
            {decision!.notes && <p className="mt-1 font-medium text-muted">{decision!.notes}</p>}
            <p className="mt-1 text-xs font-medium text-muted">
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(decision!.decidedAt)}
            </p>
          </div>
        ) : (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan reviewer (opsional)..."
              className="mt-3 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPendingOutcome("APPROVED")}
                disabled={!allChecked}
                title={!allChecked ? "Lengkapi checklist terlebih dahulu" : undefined}
                className="btn btn-primary px-3 py-2 text-sm disabled:cursor-not-allowed"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setPendingOutcome("REJECTED")}
                disabled={!allChecked}
                title={!allChecked ? "Lengkapi checklist terlebih dahulu" : undefined}
                className="btn btn-danger px-3 py-2 text-sm disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button type="button" onClick={() => setPendingOutcome("NEED_MORE_DOCUMENTS")} className="btn btn-secondary px-3 py-2 text-sm">
                Perlu Dokumen Tambahan
              </button>
              <button type="button" onClick={() => setPendingOutcome("ARCHIVED")} className="btn btn-secondary px-3 py-2 text-sm">
                Arsipkan
              </button>
            </div>
            {!allChecked && (
              <p className="mt-2 text-xs font-medium text-muted">
                Approve/Reject terkunci sampai seluruh checklist di atas dicentang.
              </p>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingOutcome !== null}
        title={`Catat keputusan "${pendingOutcome ? STATUS_LABEL[pendingOutcome] ?? pendingOutcome : ""}"?`}
        description="Keputusan ini tercatat sebagai tindakan manual notaris/compliance officer, bukan dari AI. Pastikan seluruh temuan sudah ditinjau."
        confirmLabel="Catat Keputusan"
        tone={pendingOutcome === "REJECTED" ? "danger" : "default"}
        pending={isPending}
        onConfirm={handleDecide}
        onCancel={() => setPendingOutcome(null)}
      />
    </div>
  );
}
