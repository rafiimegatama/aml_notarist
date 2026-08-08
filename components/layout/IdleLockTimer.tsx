"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 menit tanpa aktivitas -> kunci otomatis

// Event yang dianggap "aktivitas" — cukup luas supaya mouse diam tapi masih
// scroll/mengetik tidak dianggap idle, tapi tidak terlalu sering (mousemove
// tetap dipakai karena ini satu-satunya sinyal yang menangkap "masih di
// depan komputer" tanpa harus mengetik/klik).
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

/**
 * Auto-lock idle 5 menit — beda dari SessionExpiryWarning (masa berlaku
 * sesi 10 jam sejak login, berjalan terus walau notaris aktif) dan
 * LockButton (kunci manual). Ini murni deteksi "tidak ada aktivitas
 * mouse/keyboard sama sekali selama 5 menit", lalu memanggil logout()
 * (Server Action yang SAMA dipakai LockButton) — sungguhan menghapus
 * cookie sesi di server, bukan cuma redirect tampilan, supaya kembali ke
 * halaman lain (mis. lewat tombol back browser) tetap diminta PIN lagi.
 * logout() dipanggil langsung sebagai fungsi (bukan lewat <form>) — pola
 * yang sama seperti createXCustomer dipanggil dari onSubmit form CDD,
 * redirect() di dalamnya tetap jalan normal walau dipanggil begini.
 */
export function IdleLockTimer() {
  const pathname = usePathname();
  const isLockPage = pathname.startsWith("/lock");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockingRef = useRef(false);

  useEffect(() => {
    if (isLockPage) return;

    function resetTimer() {
      if (lockingRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lockingRef.current = true;
        void logout();
      }, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [isLockPage]);

  return null;
}
