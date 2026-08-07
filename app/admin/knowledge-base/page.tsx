import type { Metadata } from "next";
import { BookMarked } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeBasePanel } from "@/components/admin/knowledge-base/KnowledgeBasePanel";
import { listKnowledgeDocuments } from "@/lib/actions/knowledgeBase";

export const metadata: Metadata = {
  title: "Knowledge Base — AI Compliance Assistant",
};

export default async function KnowledgeBasePage() {
  const documents = await listKnowledgeDocuments();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge Base"
        description="Sumber regulasi/SOP yang jadi dasar jawaban AI Compliance Assistant di setiap Case. AI tidak pernah menjawab dari luar dokumen di sini."
        icon={BookMarked}
      />
      <KnowledgeBasePanel
        initialDocuments={documents.map((d) => ({
          id: d.id,
          title: d.title,
          sourceType: d.sourceType,
          createdAt: d.createdAt,
          chunkCount: d._count.chunks,
        }))}
      />
    </div>
  );
}
