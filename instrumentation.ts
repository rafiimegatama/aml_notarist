// FR-1.2 — dijalankan sekali saat server start. Guard NEXT_RUNTIME karena
// register() dipanggil Next.js di semua runtime (termasuk Edge untuk
// proxy.ts) — sinkronisasi HDD pakai fs, jadi hanya jalan di runtime Node.js.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncToExternalDrive } = await import("@/lib/hddSync");
    await syncToExternalDrive();
  }
}
