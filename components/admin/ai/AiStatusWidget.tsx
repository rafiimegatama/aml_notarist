"use client";

import { useEffect, useState } from "react";
import { Activity, CircleAlert, CircleCheck, LoaderCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AiMode, ProviderHealth } from "@/lib/ai/provider";

interface StatusSnapshot {
  mode: AiMode;
  providers: ProviderHealth[];
  error?: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  ollama: "Ollama (Local)",
  gemini: "Gemini (Cloud)",
};

const MODE_LABEL: Record<AiMode, string> = {
  local: "Local",
  cloud: "Cloud",
  hybrid: "Hybrid",
};

/**
 * Client-only, self-fetching widget — deliberately never awaited during SSR
 * so a slow/offline AI provider can never delay first paint of whichever
 * page embeds it (Dashboard or the AI Processing settings page).
 */
export function AiStatusWidget({ compact = false }: { compact?: boolean }) {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ai/status", { cache: "no-store" });
        const data = (await res.json()) as StatusSnapshot;
        if (!cancelled) setSnapshot(data);
      } catch {
        if (!cancelled) setSnapshot({ mode: "local", providers: [], error: "Tidak dapat memuat status." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={`card p-5 ${compact ? "" : "sm:p-6"}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
          Memeriksa status AI Engine...
        </div>
      </div>
    );
  }

  const providerCount = snapshot?.providers.length ?? 0;
  const healthyCount = snapshot?.providers.filter((p) => p.healthy).length ?? 0;
  const overallHealthy = providerCount > 0 && healthyCount === providerCount;
  const allDown = providerCount > 0 && healthyCount === 0;

  return (
    <div className={`card p-5 ${compact ? "" : "sm:p-6"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              overallHealthy
                ? "bg-success-subtle text-[#15803d]"
                : allDown
                  ? "bg-danger-subtle text-[#b91c1c]"
                  : "bg-warning-subtle text-[#b45309]"
            }`}
          >
            <Activity className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">AI Engine</p>
            <p className="text-xs font-medium text-muted">
              Mode {snapshot ? MODE_LABEL[snapshot.mode] : "—"}
            </p>
          </div>
        </div>
        <Badge tone={overallHealthy ? "success" : providerCount ? (allDown ? "danger" : "warning") : "neutral"}>
          {providerCount
            ? overallHealthy
              ? "Healthy"
              : allDown
                ? "Semua Provider Bermasalah"
                : "Sebagian Bermasalah"
            : "Belum Terkonfigurasi"}
        </Badge>
      </div>

      {snapshot && snapshot.providers.length > 0 && (
        <div className="mt-4 space-y-2">
          {snapshot.providers.map((p) => (
            <div
              key={p.providerId}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/70 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 font-medium text-slate-700">
                {p.healthy ? (
                  <CircleCheck className="h-4 w-4 text-[#15803d]" strokeWidth={2} />
                ) : (
                  <CircleAlert className="h-4 w-4 text-[#b91c1c]" strokeWidth={2} />
                )}
                {PROVIDER_LABEL[p.providerId] ?? p.providerId}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                {p.latencyMs !== null && (
                  <>
                    <Zap className="h-3.5 w-3.5" strokeWidth={2} />
                    {p.latencyMs}ms
                  </>
                )}
                {!p.healthy && p.message && <span className="text-[#b91c1c]">{p.message}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {snapshot && snapshot.providers.length === 0 && !snapshot.error && (
        <p className="mt-3 text-xs font-medium text-muted">
          Belum ada provider AI yang terkonfigurasi — atur di halaman AI Processing.
        </p>
      )}
    </div>
  );
}
