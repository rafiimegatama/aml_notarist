"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Cloud,
  Database,
  FileCheck2,
  Grip,
  ScanLine,
  ShieldQuestion,
  X,
  type LucideIcon,
} from "lucide-react";
import { ScanUploadPanel } from "@/components/upload/ScanUploadPanel";
import { SystemStatusCard, type SystemHealthStatus } from "@/components/dashboard/SystemStatusCard";
import { FloatingPanel } from "@/components/ui/floating-panel";
import { Badge } from "@/components/ui/badge";

export interface DashboardPendingTaskData {
  key: string;
  label: string;
  count: number;
  href: string;
}

export interface DashboardSystemHealthData {
  key: string;
  label: string;
  status: SystemHealthStatus;
  detail?: string;
}

const PENDING_TASK_ICON: Record<string, LucideIcon> = {
  waitingOcr: ScanLine,
  needRiskReview: FileCheck2,
  eddRequired: ShieldQuestion,
  missingDocuments: ClipboardList,
  expiringRetention: CalendarDays,
};

const SYSTEM_HEALTH_ICON: Record<string, LucideIcon> = {
  database: Database,
  aiEngine: BrainCircuit,
  ocr: ScanLine,
  googleDrive: Cloud,
  backup: Archive,
};

type PanelKey = "upload" | "status" | "tasks" | null;

const DIAL_ITEMS: { key: Exclude<PanelKey, null>; label: string; icon: LucideIcon }[] = [
  { key: "upload", label: "Upload Formulir Cetak (OCR)", icon: ScanLine },
  { key: "status", label: "Status Sistem", icon: Database },
  { key: "tasks", label: "Tugas Tertunda", icon: ClipboardList },
];

/**
 * Master floating button — mengganti tiga blok penuh (Upload OCR, Status
 * Sistem, Tugas Tertunda) yang sebelumnya selalu tampil di badan Dashboard,
 * supaya halaman utama cuma menyisakan konten yang benar-benar sering
 * diakses (KPI, chart, aktivitas, aksi cepat, tabel pencarian). Hover
 * (desktop) ATAU klik (sentuh/keyboard) memunculkan 3 tombol speed-dial;
 * tiap tombol membuka panel yang berisi widget aslinya apa adanya — tidak
 * ada perubahan pada ScanUploadPanel/SystemStatusCard itu sendiri.
 */
export function DashboardUtilityDial({
  pendingTasks,
  systemHealth,
}: {
  pendingTasks: DashboardPendingTaskData[];
  systemHealth: DashboardSystemHealthData[];
}) {
  const [dialOpen, setDialOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey>(null);

  const openUploadPanel = useCallback(() => {
    setActivePanel("upload");
    setDialOpen(false);
  }, []);

  // Quick Action "Unggah Dokumen" di badan Dashboard tetap link ke #upload-ocr
  // (tidak perlu diubah) — dial ini yang membuka panel Upload OCR-nya, tanpa
  // perlu prop-drilling lintas server/client. TIDAK bisa mengandalkan event
  // "hashchange" saja: next/link menavigasi hash-only href lewat
  // history.pushState (client-side routing), dan pushState/replaceState
  // TIDAK memicu "hashchange" di browser manapun — itu murni event native
  // untuk navigasi hash yang sesungguhnya (klik <a> biasa, ubah address bar,
  // tombol back/forward). Makanya diserta capture-phase click listener di
  // document yang mendeteksi klik ke href tsb secara langsung, sebelum
  // next/link sempat memanggil preventDefault().
  useEffect(() => {
    function checkHash() {
      if (window.location.hash === "#upload-ocr") {
        openUploadPanel();
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);

    function onDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href="#upload-ocr"]');
      if (anchor) openUploadPanel();
    }
    document.addEventListener("click", onDocumentClick, true);

    return () => {
      window.removeEventListener("hashchange", checkHash);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [openUploadPanel]);

  const pendingTotal = pendingTasks.reduce((sum, t) => sum + (t.count > 0 ? 1 : 0), 0);

  return (
    <>
      <div
        className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3"
        onMouseEnter={() => setDialOpen(true)}
        onMouseLeave={() => setDialOpen(false)}
      >
        <AnimatePresence>
          {dialOpen && (
            <motion.div className="flex flex-col items-end gap-3">
              {DIAL_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.key}
                    type="button"
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.9 }}
                    transition={{ duration: 0.15, delay: i * 0.04, ease: "easeOut" }}
                    onClick={() => {
                      setActivePanel(item.key);
                      setDialOpen(false);
                    }}
                    className="group flex items-center gap-3"
                  >
                    <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-soft-md transition-opacity group-hover:opacity-100">
                      {item.label}
                    </span>
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-brand-hover shadow-soft-lg ring-1 ring-border-subtle transition-transform hover:scale-105">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                      {item.key === "tasks" && pendingTotal > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                          {pendingTotal}
                        </span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setDialOpen((v) => !v)}
          aria-expanded={dialOpen}
          aria-label="Buka menu utilitas Dashboard"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-soft-lg transition-transform hover:scale-105"
        >
          <motion.span animate={{ rotate: dialOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {dialOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Grip className="h-6 w-6" strokeWidth={2} />}
          </motion.span>
        </button>
      </div>

      <FloatingPanel
        open={activePanel === "upload"}
        onClose={() => setActivePanel(null)}
        title="Upload Formulir Cetak (OCR)"
        icon={ScanLine}
      >
        <ScanUploadPanel />
      </FloatingPanel>

      <FloatingPanel
        open={activePanel === "status"}
        onClose={() => setActivePanel(null)}
        title="Status Sistem"
        description="Kondisi komponen aplikasi saat ini."
        icon={Database}
      >
        <SystemStatusCard
          items={systemHealth.map((item) => ({
            key: item.key,
            label: item.label,
            status: item.status,
            detail: item.detail,
            icon: SYSTEM_HEALTH_ICON[item.key] ?? Database,
          }))}
        />
      </FloatingPanel>

      <FloatingPanel
        open={activePanel === "tasks"}
        onClose={() => setActivePanel(null)}
        title="Tugas Tertunda"
        icon={ClipboardList}
      >
        <div className="space-y-2">
          {pendingTasks.map((task) => {
            const Icon = PENDING_TASK_ICON[task.key] ?? ClipboardList;
            return (
              <Link
                key={task.key}
                href={task.href}
                onClick={() => setActivePanel(null)}
                className="flex items-center gap-3 rounded-xl border border-border-subtle p-3.5 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    task.count > 0 ? "bg-warning-subtle text-[#b45309]" : "bg-success-subtle text-[#15803d]"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{task.label}</span>
                <Badge tone={task.count > 0 ? "warning" : "success"}>{task.count}</Badge>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
              </Link>
            );
          })}
        </div>
      </FloatingPanel>
    </>
  );
}
