import { NextRequest } from "next/server";
import { getAiSettings } from "@/lib/ai/config";
import { OllamaProvider } from "@/lib/ai/providers/ollama-provider";

// Sudah tercakup PIN gate lewat matcher default proxy.ts (tidak dikecualikan).
// Route Handler (bukan Server Action) dipakai khusus di sini karena progress
// pull model perlu di-stream baris-per-baris ke client secara real-time —
// Server Action hanya bisa mengembalikan satu nilai akhir.
export async function POST(request: NextRequest) {
  let model: string;
  try {
    const body = (await request.json()) as { model?: string };
    if (!body.model || typeof body.model !== "string") {
      return Response.json({ error: "Nama model wajib diisi." }, { status: 400 });
    }
    model = body.model;
  } catch {
    return Response.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const settings = await getAiSettings();
  const provider = new OllamaProvider(settings.local.baseUrl, settings.local.model);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const progress of provider.pullModel(model)) {
          controller.enqueue(encoder.encode(JSON.stringify(progress) + "\n"));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal mengunduh model.";
        controller.enqueue(encoder.encode(JSON.stringify({ status: "error", error: message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
