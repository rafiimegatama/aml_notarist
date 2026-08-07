"use client";

import { useState, useTransition } from "react";
import {
  BookOpen,
  Bot,
  CircleAlert,
  FileQuestion,
  FileText,
  Fingerprint,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  askComplianceQuestionAction,
  checkMissingDocumentsAction,
  generateCaseSummaryAction,
  suggestEddQuestionsAction,
} from "@/lib/actions/caseAi";
import { runDuplicateCheck } from "@/lib/actions/duplicateCheck";
import { dismissAiFinding } from "@/lib/actions/case";
import type { ComplianceAnswer } from "@/lib/ai/services/compliance";

export interface AiFindingRow {
  id: string;
  kind: string;
  content: string;
  confidence: string;
  evidence: string | null;
  sourceRefs: string | null;
  dismissed: boolean;
  createdAt: Date;
}

export interface DuplicateCheckRow {
  id: string;
  candidateCustomerId: string;
  candidateName: string;
  matchedFields: string[];
  confidencePercent: number;
  stage: string;
  recommendation: string;
}

const KIND_META: Record<string, { label: string; icon: typeof Bot }> = {
  summary: { label: "Ringkasan Case", icon: Sparkles },
  edd_question: { label: "Saran Pertanyaan EDD", icon: FileQuestion },
  missing_document: { label: "Cek Kelengkapan Dokumen", icon: FileText },
  inconsistency: { label: "Inkonsistensi Terdeteksi", icon: CircleAlert },
  duplicate: { label: "Deteksi Duplikat", icon: Fingerprint },
  regulation_answer: { label: "Jawaban Regulasi", icon: BookOpen },
};

const CONFIDENCE_TONE: Record<string, BadgeTone> = { HIGH: "success", MEDIUM: "warning", LOW: "neutral" };

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return <Badge tone={CONFIDENCE_TONE[confidence] ?? "neutral"}>{confidence}</Badge>;
}

export function CaseAiPanel({
  caseId,
  initialFindings,
  initialDuplicateChecks,
}: {
  caseId: string;
  initialFindings: AiFindingRow[];
  initialDuplicateChecks: DuplicateCheckRow[];
}) {
  const { toast } = useToast();
  const [findings, setFindings] = useState(initialFindings);
  const duplicates = initialDuplicateChecks;
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ComplianceAnswer | null>(null);
  const [asking, setAsking] = useState(false);

  function runAction(name: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setActiveAction(name);
    startTransition(async () => {
      const result = await fn();
      setActiveAction(null);
      if (!result.success) {
        toast({ variant: "error", title: "AI Assistant gagal memproses", description: result.error });
      } else {
        toast({ variant: "success", title: "Selesai", description: "Hasil AI Assistant diperbarui." });
        window.location.reload();
      }
    });
  }

  async function handleAsk() {
    if (!question.trim()) return;
    setAsking(true);
    const result = await askComplianceQuestionAction(caseId, question);
    setAnswer(result);
    setAsking(false);
    if (!result.grounded) {
      toast({ variant: "warning", title: "Tidak dapat diverifikasi", description: "Tidak ada regulasi relevan di Knowledge Base." });
    }
  }

  function handleDismiss(findingId: string) {
    startTransition(async () => {
      await dismissAiFinding(findingId);
      setFindings((prev) => prev.map((f) => (f.id === findingId ? { ...f, dismissed: true } : f)));
    });
  }

  const visibleFindings = findings.filter((f) => !f.dismissed);

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <Bot className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Compliance Assistant</h2>
            <p className="mt-1 text-xs font-medium text-muted">
              Hanya rekomendasi — tidak pernah memutuskan, mengubah data, atau menghapus dokumen. Keputusan akhir tetap di tangan Anda.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("summary", () => generateCaseSummaryAction(caseId))}
            className="btn btn-secondary justify-start px-3 py-2 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            {activeAction === "summary" ? "Memproses..." : "Ringkas Case"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("edd", () => suggestEddQuestionsAction(caseId))}
            className="btn btn-secondary justify-start px-3 py-2 text-xs"
          >
            <FileQuestion className="h-3.5 w-3.5" strokeWidth={2} />
            {activeAction === "edd" ? "Memproses..." : "Saran Pertanyaan EDD"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("docs", () => checkMissingDocumentsAction(caseId))}
            className="btn btn-secondary justify-start px-3 py-2 text-xs"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={2} />
            {activeAction === "docs" ? "Memproses..." : "Cek Dokumen"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("dup", () => runDuplicateCheck(caseId))}
            className="btn btn-secondary justify-start px-3 py-2 text-xs"
          >
            <Fingerprint className="h-3.5 w-3.5" strokeWidth={2} />
            {activeAction === "dup" ? "Memproses..." : "Cek Duplikat"}
          </button>
        </div>
      </div>

      {/* Regulation Q&A — RAG grounded */}
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-hover" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">Tanya Regulasi</h3>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="mis. Apa saja dokumen wajib EDD untuk PEP?"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button type="button" onClick={handleAsk} disabled={asking || !question.trim()} className="btn btn-primary px-3 py-2 text-xs">
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
        {asking && <p className="mt-2 text-xs font-medium text-muted">Mencari di Knowledge Base...</p>}
        {answer && !asking && (
          <div className={`mt-3 rounded-xl p-3.5 text-xs ${answer.grounded ? "bg-slate-50" : "bg-warning-subtle/60"}`}>
            <div className="flex items-center justify-between gap-2">
              <ConfidenceBadge confidence={answer.confidence} />
              {!answer.grounded && (
                <span className="flex items-center gap-1 font-semibold text-[#b45309]">
                  <CircleAlert className="h-3.5 w-3.5" strokeWidth={2} />
                  Tidak terverifikasi
                </span>
              )}
            </div>
            <p className="mt-2 font-medium text-slate-700">{answer.answer}</p>
            {answer.sources.length > 0 && (
              <div className="mt-2.5 space-y-1 border-t border-slate-200 pt-2.5">
                <p className="font-bold uppercase tracking-wide text-muted">Sumber</p>
                {answer.sources.map((s, i) => (
                  <p key={s.chunkId} className="text-muted">
                    [{i + 1}] {s.documentTitle}
                    {s.sectionLabel ? `, ${s.sectionLabel}` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Findings feed */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-900">Temuan AI</h3>
        {visibleFindings.length === 0 ? (
          <p className="mt-3 text-xs font-medium text-muted">Belum ada temuan — jalankan salah satu aksi di atas.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {visibleFindings.map((f) => {
              const meta = KIND_META[f.kind] ?? { label: f.kind, icon: Bot };
              const Icon = meta.icon;
              return (
                <div key={f.id} className="rounded-xl border border-border-subtle p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Icon className="h-3.5 w-3.5 text-brand-hover" strokeWidth={2} />
                      {meta.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <ConfidenceBadge confidence={f.confidence} />
                      <button
                        type="button"
                        onClick={() => handleDismiss(f.id)}
                        aria-label="Tandai sudah ditinjau"
                        title="Tandai sudah ditinjau"
                        className="rounded-full p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs font-medium text-slate-700">{f.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Duplicate detection results */}
      {duplicates.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-hover" strokeWidth={2} />
            <h3 className="text-sm font-bold text-slate-900">Kemungkinan Duplikat</h3>
          </div>
          <div className="mt-3 space-y-3">
            {duplicates.map((d) => (
              <div key={d.id} className="rounded-xl border border-warning-subtle bg-warning-subtle/30 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">{d.candidateName}</p>
                  <Badge tone="warning">{d.confidencePercent}%</Badge>
                </div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Cocok: {d.matchedFields.join(", ")}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-700">{d.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
