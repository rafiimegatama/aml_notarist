import { AIProcessingService } from "@/lib/ai/services/ai-processing";

// Sudah tercakup PIN gate lewat matcher default proxy.ts. Dipanggil dari
// client (bukan di-fetch saat SSR dashboard) supaya health-check provider
// AI (yang bisa lambat/timeout kalau Ollama tidak jalan) tidak pernah
// menunda render awal Dashboard.
export async function GET() {
  try {
    const snapshot = await AIProcessingService.getHealthSnapshot();
    return Response.json(snapshot);
  } catch (err) {
    return Response.json(
      { mode: "local", providers: [], error: err instanceof Error ? err.message : "Gagal memuat status AI." },
      { status: 200 }
    );
  }
}
