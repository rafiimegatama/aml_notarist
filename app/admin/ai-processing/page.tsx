import type { Metadata } from "next";
import { BrainCircuit } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AiStatusWidget } from "@/components/admin/ai/AiStatusWidget";
import { AiSettingsPanel } from "@/components/admin/ai/AiSettingsPanel";
import { OllamaModelManager } from "@/components/admin/ai/OllamaModelManager";
import { getAiSettingsAction } from "@/lib/actions/aiSettings";

export const metadata: Metadata = {
  title: "AI Processing — Pengaturan",
};

export default async function AiProcessingSettingsPage() {
  const settings = await getAiSettingsAction();

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Processing"
        description="Konfigurasi provider AI (lokal/cloud/hybrid) yang dipakai fitur-fitur AI di aplikasi — tidak memengaruhi alur OCR formulir cetak yang sudah berjalan (tetap Tesseract lokal)."
        icon={BrainCircuit}
      />

      <AiStatusWidget />

      <AiSettingsPanel initial={settings} />

      <OllamaModelManager currentModel={settings.local.model} />
    </div>
  );
}
