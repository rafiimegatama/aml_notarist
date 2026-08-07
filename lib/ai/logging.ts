import { prisma } from "@/lib/prisma";
import type { AiCapability, ProviderId } from "@/lib/ai/provider";

/**
 * Append-only AI request log — same principle as lib/activityLog.ts:
 * observability only, must NEVER throw into the caller or block/fail the
 * actual AI request it's describing.
 */
export async function logAiRequest(entry: {
  capability: AiCapability;
  providerId: ProviderId;
  model: string;
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCostUsd?: number;
  /** Diisi hanya untuk pemanggilan dari AI Compliance Assistant (lib/ai/services/compliance.ts). */
  caseId?: string;
  promptVersion?: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  knowledgeChunkIds?: string[];
}): Promise<void> {
  try {
    await prisma.aiRequestLog.create({
      data: {
        capability: entry.capability,
        providerId: entry.providerId,
        model: entry.model,
        success: entry.success,
        latencyMs: entry.latencyMs,
        errorMessage: entry.errorMessage ?? null,
        promptTokens: entry.promptTokens ?? null,
        completionTokens: entry.completionTokens ?? null,
        estimatedCostUsd: entry.estimatedCostUsd ?? null,
        caseId: entry.caseId ?? null,
        promptVersion: entry.promptVersion ?? null,
        confidence: entry.confidence ?? null,
        knowledgeChunkIds: entry.knowledgeChunkIds ? JSON.stringify(entry.knowledgeChunkIds) : null,
      },
    });
  } catch (err) {
    console.error("AI request log gagal dicatat:", err);
  }
}

export async function getRecentAiRequests(limit = 50) {
  return prisma.aiRequestLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export interface AiUsageSummary {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  totalEstimatedCostUsd: number;
  byProvider: { providerId: string; count: number }[];
}

export async function getAiUsageSummary(sinceHours = 24): Promise<AiUsageSummary> {
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const rows = await prisma.aiRequestLog.findMany({ where: { createdAt: { gte: since } } });
  const totalRequests = rows.length;
  const successCount = rows.filter((r) => r.success).length;
  const avgLatencyMs = totalRequests
    ? Math.round(rows.reduce((sum, r) => sum + r.latencyMs, 0) / totalRequests)
    : 0;
  const totalEstimatedCostUsd = rows.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0);
  const byProviderMap = new Map<string, number>();
  for (const r of rows) byProviderMap.set(r.providerId, (byProviderMap.get(r.providerId) ?? 0) + 1);
  return {
    totalRequests,
    successRate: totalRequests ? successCount / totalRequests : 1,
    avgLatencyMs,
    totalEstimatedCostUsd,
    byProvider: Array.from(byProviderMap, ([providerId, count]) => ({ providerId, count })),
  };
}
