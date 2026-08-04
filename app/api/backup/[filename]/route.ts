import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { BACKUP_DIR } from "@/lib/storage";

// Filename di sini datang dari URL, bukan lookup DB seperti
// /api/documents/[id] — jadi divalidasi ketat dulu terhadap pola nama file
// yang dibuat createBackup() (lib/actions/backup.ts) sebelum dipakai untuk
// path.join, supaya tidak bisa dipakai untuk path traversal.
const SAFE_BACKUP_FILENAME = /^backup-[0-9TZ-]+\.zip$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!SAFE_BACKUP_FILENAME.test(filename)) {
    return new NextResponse("Nama file tidak valid.", { status: 400 });
  }

  try {
    const buffer = await readFile(path.join(BACKUP_DIR, filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("File backup tidak ditemukan.", { status: 404 });
  }
}
