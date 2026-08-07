import type { Metadata } from "next";
import { Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { HeroBannerAdmin } from "@/components/admin/appearance/HeroBannerAdmin";
import { getHeroBannerSettings } from "@/lib/actions/heroSettings";

export const metadata: Metadata = {
  title: "Tampilan — Hero Banner Dashboard",
};

export default async function AppearanceSettingsPage() {
  const heroSettings = await getHeroBannerSettings();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tampilan"
        description="Kustomisasi tampilan Dashboard — saat ini hanya hero banner."
        icon={ImageIcon}
      />
      <HeroBannerAdmin initial={heroSettings} />
    </div>
  );
}
