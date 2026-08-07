import { prisma } from "@/lib/prisma";
import { AIProcessingService } from "@/lib/ai/services/ai-processing";
import { retrieveRelevantChunks, type RetrievedChunk } from "@/lib/ai/rag/retrieval";
import { logAiRequest } from "@/lib/ai/logging";
import type { ChatMessage } from "@/lib/ai/provider";

const PROMPT_VERSION = "compliance-v1";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export interface SourceCitation {
  documentTitle: string;
  sectionLabel: string | null;
  pageLabel: string | null;
  chunkId: string;
}

export interface ComplianceAnswer {
  answer: string;
  confidence: Confidence;
  sources: SourceCitation[];
  grounded: boolean;
}

const CANNOT_VERIFY_MESSAGE =
  "Saya tidak dapat memverifikasi ini dari regulasi yang tersedia di Knowledge Base. Silakan tambahkan sumber terkait di Admin > Knowledge Base, atau verifikasi manual.";

function chunksToSources(chunks: RetrievedChunk[]): SourceCitation[] {
  return chunks.map((c) => ({
    documentTitle: c.documentTitle,
    sectionLabel: c.sectionLabel,
    pageLabel: c.pageLabel,
    chunkId: c.chunkId,
  }));
}

function scoreToConfidence(topScore: number, chunkCount: number): Confidence {
  if (chunkCount === 0) return "LOW";
  if (topScore > 0.6 && chunkCount >= 2) return "HIGH";
  if (topScore > 0.3) return "MEDIUM";
  return "LOW";
}

/**
 * RAG guardrail — kalau retrieval tidak menemukan chunk yang cukup relevan,
 * TIDAK PERNAH memanggil LLM sama sekali. Ini bukan cuma "prompt bilang
 * jangan mengarang" (yang bisa diabaikan model) — kalau tidak ada konteks,
 * jawabannya secara struktural dipaksa jadi CANNOT_VERIFY_MESSAGE sebelum
 * request ke provider manapun terjadi.
 */
export async function answerRegulationQuestion(
  question: string,
  caseId?: string
): Promise<ComplianceAnswer> {
  const chunks = await retrieveRelevantChunks(question, 5);
  if (chunks.length === 0) {
    return { answer: CANNOT_VERIFY_MESSAGE, confidence: "LOW", sources: [], grounded: false };
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.documentTitle}${c.sectionLabel ? `, ${c.sectionLabel}` : ""})\n${c.content}`)
    .join("\n\n---\n\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "Anda adalah asisten kepatuhan AML untuk kantor notaris di Indonesia. JAWAB HANYA berdasarkan konteks regulasi/SOP yang diberikan di bawah — JANGAN gunakan pengetahuan lain atau mengarang. " +
        'Kalau konteks yang diberikan tidak cukup untuk menjawab, katakan dengan jelas: "Saya tidak dapat memverifikasi ini dari regulasi yang tersedia." ' +
        "Jawab singkat dan jelas dalam Bahasa Indonesia, dan rujuk nomor sumber [1], [2], dst saat relevan.\n\nKonteks:\n" +
        context,
    },
    { role: "user", content: question },
  ];

  try {
    const result = await AIProcessingService.chat(messages, { temperature: 0.1 });
    const confidence = scoreToConfidence(chunks[0].score, chunks.length);
    void logAiRequest({
      capability: "chat",
      providerId: result.providerId,
      model: result.model,
      success: true,
      latencyMs: result.latencyMs,
      caseId,
      promptVersion: PROMPT_VERSION,
      confidence,
      knowledgeChunkIds: chunks.map((c) => c.chunkId),
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      estimatedCostUsd: result.usage?.estimatedCostUsd,
    });
    return { answer: result.data, confidence, sources: chunksToSources(chunks), grounded: true };
  } catch (err) {
    return {
      answer: `AI Assistant sedang tidak dapat dijangkau (${err instanceof Error ? err.message : "error tidak diketahui"}). Verifikasi manual tetap bisa dilanjutkan.`,
      confidence: "LOW",
      sources: chunksToSources(chunks),
      grounded: false,
    };
  }
}

function customerDisplayName(customer: {
  corporateDetail?: { namaKorporasi: string } | null;
  individualDetail?: { namaLengkap: string } | null;
  legalArrangementDetail?: { nama: string } | null;
}): string {
  return (
    customer.corporateDetail?.namaKorporasi ??
    customer.individualDetail?.namaLengkap ??
    customer.legalArrangementDetail?.nama ??
    "(tanpa nama)"
  );
}

async function loadCaseWithCustomer(caseId: string) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      customer: {
        include: {
          corporateDetail: true,
          individualDetail: true,
          legalArrangementDetail: true,
          riskAssessment: true,
          highRiskAdditionalInfo: true,
          documents: true,
        },
      },
    },
  });
}

/**
 * AI FINDING: ringkasan case — bantu reviewer cepat paham konteks sebelum
 * baca semua detail. Bukan bagian dari checklist/keputusan, murni ringkasan.
 */
export async function generateCaseSummary(caseId: string): Promise<{ success: true; findingId: string } | { success: false; error: string }> {
  const kase = await loadCaseWithCustomer(caseId);
  if (!kase) return { success: false, error: "Case tidak ditemukan." };

  const name = customerDisplayName(kase.customer);
  const context = [
    `Nama: ${name}`,
    `Tipe: ${kase.customer.type}`,
    `Kategori Risiko: ${kase.customer.riskAssessment?.riskCategory ?? "belum final"}`,
    `Total Nilai: ${kase.customer.riskAssessment?.totalScore ?? "belum final"}`,
    kase.customer.riskAssessment?.isPep ? "Terindikasi PEP (Politically Exposed Person)." : null,
    `Jumlah dokumen terlampir: ${kase.customer.documents.length}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await AIProcessingService.summarize(
      `Ringkas profil kepatuhan AML berikut dalam 3-4 kalimat untuk reviewer, sebutkan hal yang paling perlu diperhatikan:\n\n${context}`
    );
    const finding = await prisma.caseAiFinding.create({
      data: {
        caseId,
        kind: "summary",
        content: result.data,
        confidence: "MEDIUM",
        providerId: result.providerId,
        model: result.model,
      },
    });
    void logAiRequest({
      capability: "summarize",
      providerId: result.providerId,
      model: result.model,
      success: true,
      latencyMs: result.latencyMs,
      caseId,
      promptVersion: PROMPT_VERSION,
      confidence: "MEDIUM",
    });
    return { success: true, findingId: finding.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "AI Engine tidak dapat dijangkau." };
  }
}

/**
 * AI FINDING: saran pertanyaan EDD, digrounded ke Knowledge Base (EDD
 * guideline) kalau ada, plus konteks case. Selalu sekadar SARAN — notaris
 * tetap yang memutuskan pertanyaan mana yang benar-benar diajukan.
 */
export async function suggestEddQuestions(caseId: string): Promise<{ success: true; findingId: string } | { success: false; error: string }> {
  const kase = await loadCaseWithCustomer(caseId);
  if (!kase) return { success: false, error: "Case tidak ditemukan." };

  const name = customerDisplayName(kase.customer);
  const chunks = await retrieveRelevantChunks("enhanced due diligence source of funds source of wealth pertanyaan", 3);
  const knowledgeContext = chunks.length
    ? `\n\nReferensi pedoman EDD:\n${chunks.map((c) => `- (${c.documentTitle}) ${c.content.slice(0, 300)}`).join("\n")}`
    : "";

  const prompt =
    `Pengguna jasa "${name}" (${kase.customer.type}) dikategorikan risiko Tinggi dan memerlukan Enhanced Due Diligence. ` +
    `Sebagai asisten kepatuhan, sarankan 4-6 pertanyaan EDD spesifik yang perlu diajukan notaris ke klien ini (mis. sumber dana, sumber kekayaan, tujuan transaksi). ` +
    `Format sebagai daftar bernomor.${knowledgeContext}`;

  try {
    const result = await AIProcessingService.chat([{ role: "user", content: prompt }], { temperature: 0.3 });
    const confidence: Confidence = chunks.length > 0 ? "MEDIUM" : "LOW";
    const finding = await prisma.caseAiFinding.create({
      data: {
        caseId,
        kind: "edd_question",
        content: result.data,
        confidence,
        sourceRefs: chunks.length ? JSON.stringify(chunksToSources(chunks)) : null,
        providerId: result.providerId,
        model: result.model,
      },
    });
    void logAiRequest({
      capability: "chat",
      providerId: result.providerId,
      model: result.model,
      success: true,
      latencyMs: result.latencyMs,
      caseId,
      promptVersion: PROMPT_VERSION,
      confidence,
      knowledgeChunkIds: chunks.map((c) => c.chunkId),
    });
    return { success: true, findingId: finding.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "AI Engine tidak dapat dijangkau." };
  }
}

// Dokumen yang lazim dibutuhkan per tipe CDD — dipakai HANYA sebagai daftar
// pembanding deterministik (bukan tebakan LLM) untuk findMissingDocuments.
// Ini SENGAJA bukan panggilan AI: memastikan dokumen ada/tidak ada di
// database adalah fakta terstruktur, bukan sesuatu yang perlu "ditebak"
// model — deterministik lebih akurat dan tidak berisiko halusinasi di sini.
const EXPECTED_DOCUMENT_HINTS: Record<string, string[]> = {
  PERORANGAN: ["KTP/Identitas", "NPWP (jika ada)"],
  KORPORASI: ["Akta Pendirian/Perubahan", "NPWP Perusahaan", "Identitas Pengurus", "Deklarasi Pemilik Manfaat (BO)"],
  LEGAL_ARRANGEMENT: ["Dokumen Perikatan/Trust Deed", "Identitas Pihak Terkait"],
};

export interface MissingDocumentCheck {
  expectedHints: string[];
  attachedCount: number;
  likelyMissing: boolean;
}

/** Deterministik — lihat komentar EXPECTED_DOCUMENT_HINTS. Tidak memanggil AI provider apa pun. */
export async function checkMissingDocuments(caseId: string): Promise<MissingDocumentCheck | null> {
  const kase = await loadCaseWithCustomer(caseId);
  if (!kase) return null;
  const hints = EXPECTED_DOCUMENT_HINTS[kase.customer.type] ?? [];
  const attachedCount = kase.customer.documents.length;
  return { expectedHints: hints, attachedCount, likelyMissing: attachedCount < hints.length };
}

export async function recordMissingDocumentFinding(caseId: string): Promise<{ success: true; findingId: string } | { success: false; error: string }> {
  const check = await checkMissingDocuments(caseId);
  if (!check) return { success: false, error: "Case tidak ditemukan." };
  const content = check.likelyMissing
    ? `Dokumen terlampir (${check.attachedCount}) kemungkinan belum lengkap. Dokumen yang biasanya diperlukan: ${check.expectedHints.join(", ")}.`
    : `Jumlah dokumen terlampir (${check.attachedCount}) sudah sesuai perkiraan minimum untuk tipe CDD ini.`;
  const finding = await prisma.caseAiFinding.create({
    data: {
      caseId,
      kind: "missing_document",
      content,
      confidence: "HIGH", // deterministik, bukan tebakan model
      providerId: null,
      model: null,
    },
  });
  return { success: true, findingId: finding.id };
}
