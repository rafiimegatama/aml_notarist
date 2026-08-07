"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { findPotentialDuplicates, type DuplicateCandidate } from "@/lib/actions/duplicateLookup";
import { AIProcessingService } from "@/lib/ai/services/ai-processing";
import { logAiRequest } from "@/lib/ai/logging";

/**
 * Pipeline deteksi duplikat untuk satu Case:
 *   1. Exact/fuzzy match deterministik (findPotentialDuplicates — sudah ada,
 *      dipakai apa adanya, TIDAK diubah) atas No. Identitas/NPWP dan No. HP
 *      milik customer case ini.
 *   2. Untuk tiap kandidat yang lolos tahap 1, AI Semantic Comparison
 *      membandingkan profil (nama, dsb) untuk memberi confidence % dan
 *      penjelasan — TIDAK PERNAH menggabungkan/memblokir otomatis, murni
 *      rekomendasi untuk reviewer.
 * Disimpan sebagai CaseDuplicateCheck per kandidat, stage terakhir yang
 * berhasil (ai_semantic kalau AI tersedia, kalau tidak tetap tersimpan
 * sebagai exact/fuzzy — deteksi duplikat TIDAK boleh berhenti total hanya
 * karena AI Engine sedang tidak tersedia).
 */
export async function runDuplicateCheck(caseId: string): Promise<{ success: true; count: number } | { success: false; error: string }> {
  const kase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      customer: {
        include: {
          individualDetail: { select: { namaLengkap: true, noIdentitas: true, nomorHp: true } },
          corporateDetail: { select: { namaKorporasi: true, npwp: true, nomorTelepon: true } },
          legalArrangementDetail: { select: { nama: true, noIdentitas: true, npwp: true, nomorTelepon: true } },
        },
      },
    },
  });
  if (!kase) return { success: false, error: "Case tidak ditemukan." };

  const detail = kase.customer.individualDetail ?? kase.customer.corporateDetail ?? kase.customer.legalArrangementDetail;
  if (!detail) return { success: false, error: "Data customer belum lengkap." };

  const identityValue =
    "noIdentitas" in detail ? detail.noIdentitas : "npwp" in detail ? detail.npwp : null;
  const phoneValue =
    "nomorHp" in detail ? detail.nomorHp : "nomorTelepon" in detail ? detail.nomorTelepon : null;

  const queries = [identityValue, phoneValue, "npwp" in detail ? detail.npwp : null].filter(
    (v): v is string => !!v && v.trim().length > 0
  );
  if (queries.length === 0) {
    return { success: false, error: "Customer ini belum punya No. Identitas/NPWP/No. HP untuk dicocokkan." };
  }

  const candidatesByCustomer = new Map<string, DuplicateCandidate>();
  for (const q of queries) {
    const found = await findPotentialDuplicates(q);
    for (const c of found) {
      if (c.customerId === kase.customerId) continue; // bukan duplikat dari dirinya sendiri
      if (!candidatesByCustomer.has(c.customerId)) candidatesByCustomer.set(c.customerId, c);
    }
  }

  const candidates = Array.from(candidatesByCustomer.values());
  if (candidates.length === 0) {
    return { success: true, count: 0 };
  }

  const thisName =
    kase.customer.individualDetail?.namaLengkap ??
    kase.customer.corporateDetail?.namaKorporasi ??
    kase.customer.legalArrangementDetail?.nama ??
    "(tanpa nama)";

  let stored = 0;
  for (const candidate of candidates) {
    const matchedFields = [candidate.matchedOn];
    let confidencePercent = 70; // default deterministik (exact/fuzzy match tanpa AI)
    let recommendation = `Cocok pada ${candidate.matchedOn} dengan "${candidate.label}". Tinjau data lengkap sebelum melanjutkan.`;
    let stage: "exact" | "fuzzy" | "ai_semantic" = candidate.matchedOn.includes("Identitas") || candidate.matchedOn.includes("NPWP") ? "exact" : "fuzzy";

    try {
      const prompt =
        `Bandingkan dua profil pengguna jasa notaris berikut, apakah kemungkinan orang/entitas yang SAMA (duplikat)?\n\n` +
        `Profil A (case saat ini): ${thisName}\n` +
        `Profil B (kandidat): ${candidate.label}, cocok pada field: ${candidate.matchedOn}\n\n` +
        `Balas HANYA JSON: {"confidencePercent": angka 0-100, "matchedFields": array string field yang cocok, "recommendation": penjelasan singkat satu kalimat dalam Bahasa Indonesia}.`;
      const result = await AIProcessingService.chat([{ role: "user", content: prompt }], { temperature: 0.1 });
      const jsonStart = result.data.indexOf("{");
      const jsonEnd = result.data.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const parsed = JSON.parse(result.data.slice(jsonStart, jsonEnd + 1)) as {
          confidencePercent?: number;
          matchedFields?: string[];
          recommendation?: string;
        };
        if (typeof parsed.confidencePercent === "number") confidencePercent = parsed.confidencePercent;
        if (Array.isArray(parsed.matchedFields) && parsed.matchedFields.length > 0) {
          matchedFields.push(...parsed.matchedFields.filter((f) => !matchedFields.includes(f)));
        }
        if (parsed.recommendation) recommendation = parsed.recommendation;
        stage = "ai_semantic";
      }
      void logAiRequest({
        capability: "chat",
        providerId: result.providerId,
        model: result.model,
        success: true,
        latencyMs: result.latencyMs,
        caseId,
        promptVersion: "duplicate-check-v1",
      });
    } catch {
      // AI tidak tersedia — tetap simpan hasil deterministik (exact/fuzzy),
      // pipeline deteksi duplikat tidak boleh berhenti total karenanya.
    }

    await prisma.caseDuplicateCheck.create({
      data: {
        caseId,
        candidateCustomerId: candidate.customerId,
        matchedFields: JSON.stringify(matchedFields),
        confidencePercent: Math.max(0, Math.min(100, Math.round(confidencePercent))),
        stage,
        recommendation,
      },
    });
    stored++;
  }

  revalidatePath(`/cases/${caseId}`);
  return { success: true, count: stored };
}
