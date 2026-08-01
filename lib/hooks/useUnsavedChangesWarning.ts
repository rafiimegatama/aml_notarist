"use client";

import { useEffect } from "react";

// Menampilkan konfirmasi browser saat user menutup tab/refresh dengan form
// yang sudah diubah tapi belum tersimpan. Tidak menangkap navigasi in-app
// (klik <Link>) — App Router tidak menyediakan before-navigate hook tanpa
// dependency tambahan.
export function useUnsavedChangesWarning(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarn]);
}
