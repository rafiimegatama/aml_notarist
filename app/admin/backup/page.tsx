import type { Metadata } from "next";
import { getLastBackupInfo } from "@/lib/actions/backup";
import { getBackupChannelsStatus } from "@/lib/actions/backupStatus";
import { BackupPanel } from "@/components/admin/BackupPanel";
import { SheetsFullSyncPanel } from "@/components/admin/SheetsFullSyncPanel";

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

export default async function AdminBackupPage() {
  const [lastBackup, channels] = await Promise.all([
    getLastBackupInfo(),
    getBackupChannelsStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Backup Data</h1>
        <p className="mt-1 text-sm text-gray-500">
          Empat channel backup independen (FR-1) — semuanya boleh gagal diam
          -diam tanpa mengganggu pekerjaan CDD utama, tapi status masing
          -masing tetap terlihat di sini supaya diam tidak disalahartikan
          sebagai berhasil.
        </p>
      </div>

      <BackupPanel initialLastBackup={lastBackup} />

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Status Channel Lainnya
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-gray-500">
              Sinkronisasi HDD Eksternal (1.2)
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {!channels.hdd.configured
                ? "Belum dikonfigurasi (BACKUP_HDD_PATH kosong)"
                : channels.hdd.lastSyncAt
                  ? `Terakhir berhasil: ${formatDateTime(channels.hdd.lastSyncAt)}`
                  : "Terkonfigurasi, belum pernah berhasil sinkron (drive belum terpasang saat app start?)"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Google Sheets (1.3)</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {channels.sheets.configured
                ? "Terkonfigurasi — sinkron otomatis saat status CDD jadi Lengkap"
                : "Belum dikonfigurasi"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Google Drive (1.4)</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {channels.drive.configured
                ? "Terkonfigurasi — scan baru otomatis dibackup"
                : "Belum dikonfigurasi"}
            </dd>
          </div>
        </dl>
      </section>

      {channels.sheets.configured && <SheetsFullSyncPanel />}
    </div>
  );
}
