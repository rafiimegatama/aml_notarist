"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "Ctrl+Shift+L", description: "Kunci layar" },
  { keys: "Ctrl+K", description: "Fokus pencarian (atau buka Dashboard)" },
  { keys: "Esc", description: "Tutup menu/dialog yang terbuka" },
  { keys: "?", description: "Tampilkan daftar shortcut ini" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function ShortcutsHelpDialog({ onClose }: { onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-soft-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="shortcuts-dialog-title" className="text-lg font-bold text-slate-900">
            Keyboard Shortcut
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <dl className="mt-5 space-y-3">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4">
              <dt className="text-sm font-medium text-slate-600">{s.description}</dt>
              <dd>
                <kbd className="rounded-lg border border-border-subtle bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700">
                  {s.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/**
 * Shortcut global (dipasang sekali di root layout). Kunci layar sendiri ADA
 * di components/layout/LockButton.tsx (dekat dengan form yang dipicunya) —
 * di sini cuma dua yang murni navigasi/UI: Ctrl+K (fokus pencarian
 * Dashboard) dan "?" (bantuan). "?" sengaja dicek `isTypingTarget` supaya
 * tidak menyita tombol "?" saat notaris mengetik teks biasa (mis. field
 * Catatan LTKM) — Ctrl+K TIDAK perlu cek itu karena kombinasi modifier tidak
 * mungkin bagian dari pengetikan teks normal, sama seperti konvensi Ctrl+K
 * di Slack/Notion/Linear.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (pathname === "/") {
          document.getElementById("q")?.focus();
        } else {
          router.push("/");
        }
        return;
      }
      if (e.key === "?" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setHelpOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  if (!helpOpen) return null;
  return <ShortcutsHelpDialog onClose={() => setHelpOpen(false)} />;
}
