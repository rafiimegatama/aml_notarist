import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getHeroBannerSettings } from "@/lib/actions/heroSettings";
import { HERO_DIR } from "@/lib/storage";

// Sudah tercakup PIN gate lewat matcher default proxy.ts.
export async function GET() {
  const settings = await getHeroBannerSettings();
  if (!settings.enabled || !settings.filename || !settings.mimeType) {
    return new NextResponse("Hero banner tidak dikonfigurasi.", { status: 404 });
  }

  // settings.filename selalu nama file UUID buatan server (lihat
  // uploadHeroImage) — tidak pernah berasal langsung dari input pengguna.
  try {
    const buffer = await readFile(path.join(HERO_DIR, settings.filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": settings.mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse("File tidak ditemukan di disk.", { status: 404 });
  }
}
