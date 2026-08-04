import type { Metadata } from "next";
import { getLastBackupInfo } from "@/lib/actions/backup";
import { BackupPanel } from "@/components/admin/BackupPanel";

export const metadata: Metadata = {
  title: "Backup Data",
};

export default async function AdminBackupPage() {
  const lastBackup = await getLastBackupInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Backup Data</h1>
        <p className="mt-1 text-sm text-gray-500">
          FR-1.1 — backup manual. Layer backup lainnya (sinkronisasi HDD
          eksternal, Google Sheets, Google Drive) menyusul di fase
          berikutnya.
        </p>
      </div>
      <BackupPanel initialLastBackup={lastBackup} />
    </div>
  );
}
