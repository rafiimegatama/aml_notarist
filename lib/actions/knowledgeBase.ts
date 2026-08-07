"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { chunkRegulationText } from "@/lib/ai/rag/chunking";
import { SOURCE_TYPES, type SourceType } from "@/lib/knowledgeBaseTypes";

export async function listKnowledgeDocuments() {
  return prisma.knowledgeDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
}

export type AddKnowledgeDocumentResult = { success: true; documentId: string } | { success: false; error: string };

export async function addKnowledgeDocument(
  title: string,
  sourceType: SourceType,
  rawText: string
): Promise<AddKnowledgeDocumentResult> {
  const trimmedTitle = title.trim();
  const trimmedText = rawText.trim();
  if (!trimmedTitle) return { success: false, error: "Judul dokumen wajib diisi." };
  if (!trimmedText || trimmedText.length < 50) {
    return { success: false, error: "Teks regulasi terlalu pendek (minimal 50 karakter)." };
  }
  if (!SOURCE_TYPES.includes(sourceType)) {
    return { success: false, error: "Jenis sumber tidak dikenal." };
  }

  const chunks = chunkRegulationText(trimmedText);
  if (chunks.length === 0) {
    return { success: false, error: "Tidak ada bagian teks yang bisa dipotong jadi chunk — periksa kembali isi teks." };
  }

  const doc = await prisma.knowledgeDocument.create({
    data: {
      title: trimmedTitle,
      sourceType,
      chunks: {
        create: chunks.map((c) => ({
          content: c.content,
          sectionLabel: c.sectionLabel,
          pageLabel: c.pageLabel,
        })),
      },
    },
  });

  revalidatePath("/admin/knowledge-base");
  return { success: true, documentId: doc.id };
}

export type DeleteKnowledgeDocumentResult = { success: true } | { success: false; error: string };

export async function deleteKnowledgeDocument(id: string): Promise<DeleteKnowledgeDocumentResult> {
  await prisma.knowledgeDocument.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/knowledge-base");
  return { success: true };
}
