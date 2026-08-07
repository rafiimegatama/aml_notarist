import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Archive, HardDrive, Sheet, Cloud } from "lucide-react";
import { getLastBackupInfo } from "@/lib/actions/backup";
import { getBackupChannelsStatus } from "@/lib/actions/backupStatus";
import { BackupPanel } from "@/components/admin/BackupPanel";
import { SheetsFullSyncPanel } from "@/components/admin/SheetsFullSyncPanel";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Backup Data",
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function ChannelStatusCard({
  icon: Icon,
  title,
  configured,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  configured: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <Badge tone={configured ? "success" : "neutral"} className="ml-auto shrink-0">
          {configured ? "Terkonfigurasi" : "Belum dikonfigurasi"}
        </Badge>
      </div>
      <p className="mt-3 text-sm font-medium text-muted">{detail}</p>
    </div>
  );
}

export default async function AdminBackupPage() {
  const [lastBackup, channels] = await Promise.all([
    getLastBackupInfo(),
    getBackupChannelsStatus(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Backup Data"
        description="Empat channel backup independen (FR-1) — semuanya boleh gagal diam-diam tanpa mengganggu pekerjaan CDD utama, tapi status masing-masing tetap terlihat di sini supaya diam tidak disalahartikan sebagai berhasil."
        icon={Archive}
      />

      <BackupPanel initialLastBackup={lastBackup} />

      <section className="card p-6 sm:p-7">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          Status Channel Lainnya
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ChannelStatusCard
            icon={HardDrive}
            title="Sinkronisasi HDD Eksternal (1.2)"
            configured={channels.hdd.configured}
            detail={
              !channels.hdd.configured
                ? "Belum dikonfigurasi (BACKUP_HDD_PATH kosong)"
                : channels.hdd.lastSyncAt
                  ? `Terakhir berhasil: ${formatDateTime(channels.hdd.lastSyncAt)}`
                  : "Terkonfigurasi, belum pernah berhasil sinkron (drive belum terpasang saat app start?)"
            }
          />
          <ChannelStatusCard
            icon={Sheet}
            title="Google Sheets (1.3)"
            configured={channels.sheets.configured}
            detail={
              channels.sheets.configured
                ? "Terkonfigurasi — sinkron otomatis saat status CDD jadi Lengkap"
                : "Belum dikonfigurasi"
            }
          />
          <ChannelStatusCard
            icon={Cloud}
            title="Google Drive (1.4)"
            configured={channels.drive.configured}
            detail={
              channels.drive.configured
                ? "Terkonfigurasi — scan baru otomatis dibackup"
                : "Belum dikonfigurasi"
            }
          />
        </div>
      </section>

      {channels.sheets.configured && <SheetsFullSyncPanel />}
    </div>
  );
}
