import { randomUUID } from "node:crypto";

/**
 * Extracted from lib/actions/document.ts (a "use server" file — every export
 * from such a file must be an async Server Action, so a small sync helper
 * like this cannot live there, see the same pattern already used for
 * lib/customerFormMapping.ts / lib/backupArchive.ts / lib/transactionHelpers.ts).
 *
 * Deliberately takes NO filename input at all — the stored name is always
 * server-generated (random UUID + a fixed extension from this allowlist),
 * which is what makes path traversal via a malicious upload filename
 * structurally impossible rather than merely filtered: there is no code
 * path where client-controlled text can become part of a storage path.
 */
export const ALLOWED_UPLOAD_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Returns a random server-generated storage filename, or null if mimeType is not allowlisted. */
export function generateStoredFilename(mimeType: string): string | null {
  const ext = ALLOWED_UPLOAD_MIME[mimeType];
  return ext ? `${randomUUID()}.${ext}` : null;
}
