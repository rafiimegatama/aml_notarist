import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR } from "@/lib/storage";
import { decryptDocumentBuffer } from "@/lib/documentEncryption";
import { authorizeDocumentAccess, AuthorizationError } from "@/lib/authorization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // AUTHENTICATE -> AUTHORIZE OBJECT happens fully inside
  // authorizeDocumentAccess() BEFORE any file read/decrypt below — an
  // unauthorized/unauthenticated request never reaches decryptDocumentBuffer.
  let doc;
  try {
    doc = await authorizeDocumentAccess(id);
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return new NextResponse(err.message, { status: err.status });
    }
    throw err;
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
