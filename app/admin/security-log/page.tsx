import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getSecurityEvents } from "@/lib/securityLog";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Log Keamanan",
};

const EVENT_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "Login berhasil",
  LOGIN_FAILED: "Percobaan login gagal",
  LOCKOUT_TRIGGERED: "Lockout aktif",
  LOGOUT: "Kunci layar manual",
  SESSION_EXTENDED: "Sesi diperpanjang",
  PIN_RESET: "PIN direset",
  BACKUP_CREATED: "Backup dibuat",
  CUSTOMER_DELETED: "Data CDD dihapus",
};

const EVENT_TONES: Record<string, string> = {
  LOGIN_SUCCESS: "text-[#15803d]",
  LOGIN_FAILED: "text-[#b45309]",
  LOCKOUT_TRIGGERED: "text-[#b91c1c]",
  LOGOUT: "text-slate-600",
  SESSION_EXTENDED: "text-slate-600",
  PIN_RESET: "text-[#b45309]",
  BACKUP_CREATED: "text-[#15803d]",
  CUSTOMER_DELETED: "text-[#b91c1c]",
};

function formatTs(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(new Date(iso));
}

export default async function AdminSecurityLogPage() {
  const events = await getSecurityEvents();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Log Keamanan"
        description="Catatan event keamanan sistem: login, lockout, reset PIN, backup, dan penghapusan data. Append-only — 500 event terbaru ditampilkan."
        icon={ShieldCheck}
      />

      {events.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ShieldCheck}
            title="Belum ada event keamanan"
            description="Log akan terisi saat ada aktivitas login, lockout, backup, atau penghapusan data."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-slate-50/70 text-muted">
                  <th className="px-5 py-3.5 font-semibold">Waktu</th>
                  <th className="px-5 py-3.5 font-semibold">Event</th>
                  <th className="px-5 py-3.5 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {events.map((e, i) => (
                  <tr key={i} className="transition-colors hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted">
                      {formatTs(e.ts)}
                    </td>
                    <td className={`px-5 py-3 font-semibold ${EVENT_TONES[e.type] ?? "text-slate-700"}`}>
                      {EVENT_LABELS[e.type] ?? e.type}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{e.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
