"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, LoaderCircle } from "lucide-react";
import { extendSession } from "@/lib/actions/auth";

const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // tampilkan 5 menit sebelum habis
const POLL_INTERVAL_MS = 30_000;

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SessionExpiryWarning() {
  const pathname = usePathname();
  const router = useRouter();
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [extending, setExtending] = useState(false);
  const isLockPage = pathname.startsWith("/lock");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/session/status", { cache: "no-store" });
      const data = (await res.json()) as { expiresAt: number | null };
      setExpiresAt(data.expiresAt);
    } catch {
      // Gagal cek status sesi (mis. offline sesaat) — jangan tampilkan
      // peringatan palsu, cukup coba lagi di polling berikutnya.
    }
  }, []);

  useEffect(() => {
    if (isLockPage) return;
    void (async () => {
      await fetchStatus();
    })();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLockPage, fetchStatus]);

  useEffect(() => {
    function tick() {
      if (expiresAt === null) {
        setRemainingMs(null);
        return;
      }
      const remaining = expiresAt - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        router.push("/lock");
      }
    }
    void (async () => {
      tick();
    })();
    if (expiresAt === null) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

  async function handleExtend() {
    setExtending(true);
    const result = await extendSession();
    setExtending(false);
    if (result.success) {
      await fetchStatus();
    }
  }

  if (isLockPage) return null;
  const showWarning = remainingMs !== null && remainingMs > 0 && remainingMs <= WARNING_THRESHOLD_MS;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="alert"
          className="fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-warning-subtle bg-white px-5 py-3.5 shadow-soft-lg"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-subtle text-[#b45309]">
            <Clock className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Sesi akan berakhir dalam {formatRemaining(remainingMs ?? 0)}
            </p>
            <p className="text-xs font-medium text-muted">Perpanjang supaya tidak perlu masukkan PIN lagi.</p>
          </div>
          <button
            type="button"
            onClick={handleExtend}
            disabled={extending}
            className="btn btn-primary ml-1 px-3.5 py-2 text-sm"
          >
            {extending && <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />}
            Perpanjang Sesi
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
