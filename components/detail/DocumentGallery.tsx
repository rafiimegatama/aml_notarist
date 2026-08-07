"use client";

import { useState } from "react";
import { FileCard } from "@/components/ui/file-card";
import { UploadEmptyState } from "@/components/ui/upload-empty-state";
import { UploadPreviewModal } from "@/components/ui/upload-preview";
import { formatDate } from "@/components/detail/DetailPrimitives";

export interface GalleryDocument {
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: Date;
}

/**
 * Read-only display of documents already attached to a Customer (scans
 * uploaded for OCR). There is no delete action for persisted documents —
 * they're a permanent audit-trail attachment on the record.
 */
export function DocumentGallery({ documents }: { documents: GalleryDocument[] }) {
  const [previewDoc, setPreviewDoc] = useState<GalleryDocument | null>(null);

  if (documents.length === 0) {
    return (
      <UploadEmptyState description="Dokumen hasil scan/foto akan muncul di sini setelah diunggah lewat fitur OCR." />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {documents.map((doc) => {
          const isImage = doc.mimeType.startsWith("image/");
          const src = `/api/documents/${doc.id}`;
          return (
            <FileCard
              key={doc.id}
              fileName={doc.fileName}
              extLabel={doc.fileName.split(".").pop() ?? ""}
              metaLabel={formatDate(doc.createdAt)}
              isImage={isImage}
              thumbnailSrc={isImage ? src : undefined}
              status="success"
              statusLabel="Tersimpan"
              onPreview={() => {
                if (isImage) setPreviewDoc(doc);
                else window.open(src, "_blank", "noopener,noreferrer");
              }}
            />
          );
        })}
      </div>

      {previewDoc && (
        <UploadPreviewModal
          open={previewDoc !== null}
          onClose={() => setPreviewDoc(null)}
          src={`/api/documents/${previewDoc.id}`}
          fileName={previewDoc.fileName}
        />
      )}
    </>
  );
}
