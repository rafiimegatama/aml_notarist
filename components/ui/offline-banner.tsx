"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, WifiOff } from "lucide-react";

/**
 * Detects browser-level connectivity (navigator.onLine + online/offline
 * events) and shows a persistent top banner while offline. This is a local
 * app (FR-6A, bound to 127.0.0.1) so "offline" here almost always means the
 * machine itself lost network, not the app server — the banner auto-hides
 * the instant the browser reports back online, no manual dismiss needed.
 */
export function OfflineBanner() {
  // Selalu mulai dari "online" di render pertama (server & client) supaya
  // tidak mismatch saat hydration — navigator.onLine cuma boleh dibaca
  // setelah mount (lihat efek di bawah), bukan sinkron saat render.
  const [isOffline, setIsOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    void (async () => {
      setIsOffline(!navigator.onLine);
    })();
    function onOffline() {
      setIsOffline(true);
    }
    function onOnline() {
      setIsOffline(false);
      setRetrying(false);
    }
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  function retry() {
    setRetrying(true);
    setTimeout(() => {
      setIsOffline(!navigator.onLine);
      setRetrying(false);
    }, 600);
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="alert"
          className="sticky top-0 z-50 flex items-center justify-center gap-2.5 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <WifiOff className="h-4 w-4 shrink-0" strokeWidth={2} />
          Tidak ada koneksi jaringan — perubahan mungkin tidak tersimpan.
          <button
            type="button"
            onClick={retry}
            disabled={retrying}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCw className={`h-3 w-3 ${retrying ? "animate-spin" : ""}`} strokeWidth={2} />
            Coba Lagi
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
