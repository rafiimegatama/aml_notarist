"use client";

import { useEffect, useRef } from "react";
import type { Bbox } from "@/lib/ocr/extractFields";

const CROP_PADDING_PX = 20;
const MAX_DISPLAY_WIDTH_PX = 240;

/**
 * FR-3 (Should) — cuplikan gambar sumber untuk field identitas kritis (nama,
 * no. identitas), supaya notaris bisa cek visual tanpa scroll ke dump teks
 * OCR mentah. Hanya render kalau field ini punya bbox (lihat FieldGuess di
 * lib/ocr/extractFields.ts) — tidak semua guess punya word yang match.
 */
export function OcrCroppedSnippet({
  documentId,
  bbox,
}: {
  documentId: string;
  bbox: Bbox | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!bbox) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      const sx = Math.max(0, bbox.x0 - CROP_PADDING_PX);
      const sy = Math.max(0, bbox.y0 - CROP_PADDING_PX);
      const sw = Math.min(
        img.naturalWidth - sx,
        bbox.x1 - bbox.x0 + CROP_PADDING_PX * 2
      );
      const sh = Math.min(
        img.naturalHeight - sy,
        bbox.y1 - bbox.y0 + CROP_PADDING_PX * 2
      );
      if (sw <= 0 || sh <= 0) return;
      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    };
    img.src = `/api/documents/${documentId}`;
  }, [documentId, bbox]);

  if (!bbox) return null;

  return (
    <div className="mt-2 inline-block rounded-xl border border-border-subtle bg-canvas p-1.5 shadow-soft-sm">
      <canvas
        ref={canvasRef}
        style={{ maxWidth: MAX_DISPLAY_WIDTH_PX }}
        className="rounded-lg"
      />
      <p className="mt-1 text-center text-[10px] font-medium text-muted">
        Cuplikan dari scan asli
      </p>
    </div>
  );
}
