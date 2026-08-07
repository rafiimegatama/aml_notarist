"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

/**
 * Tombol mengambang untuk mengunci layar manual sebelum menjauh dari PC
 * (data CDD sensitif, aplikasi lokal tanpa idle-timeout otomatis di luar
 * masa berlaku sesi 10 jam). Disembunyikan di bawah /lock — kalau pathname
 * sudah di situ, proxy.ts membuktikan sesi memang belum/tidak ada, jadi
 * tombol "kunci" di halaman yang sudah terkunci tidak relevan.
 *
 * Ctrl+Shift+L (bukan Ctrl+L) memicu form yang sama lewat requestSubmit() —
 * Ctrl+L sendiri TIDAK BISA dipakai: browser (Chrome/Edge/Firefox) mencegat
 * kombinasi itu sebelum sampai ke JS halaman sama sekali (fokus address bar,
 * proteksi anti-phishing bawaan browser, bukan sesuatu yang bisa dilangkahi
 * dari kode aplikasi). Sengaja TIDAK dicek apakah fokus sedang di form
 * field — mengunci layar harus selalu bisa dipicu cepat tanpa terhalang
 * konteks apa pun, itu justru inti fiturnya.
 */
export function LockButton() {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const isLockPage = pathname.startsWith("/lock");

  useEffect(() => {
    if (isLockPage) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isLockPage]);

  if (isLockPage) return null;

  return (
    <form ref={formRef} action={logout} className="fixed bottom-6 right-6 z-50">
      <button
        type="submit"
        title="Kunci layar (Ctrl+Shift+L)"
        aria-label="Kunci layar (Ctrl+Shift+L)"
        className="btn btn-secondary rounded-full px-4 py-3 text-sm shadow-soft-lg hover:shadow-soft-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Kunci Layar
      </button>
    </form>
  );
}
