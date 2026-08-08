import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/storage";
import { decryptDocumentBuffer } from "@/lib/documentEncryption";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await prisma.customerDocument.findUnique({ where: { id } });
  if (!doc) {
    return new NextResponse("Dokumen tidak ditemukan.", { status: 404 });
  }

  // doc.filePath selalu nama file UUID buatan server (lihat
  // uploadAndExtractDocument) — tidak pernah berasal langsung dari input
  // pengguna, jadi aman dipakai untuk path.join tanpa risiko path traversal.
  try {
    const encrypted = await readFile(path.join(UPLOAD_DIR, doc.filePath));
    const buffer = decryptDocumentBuffer(encrypted);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("File tidak ditemukan di disk.", { status: 404 });
  }
}
