import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";

/**
 * Thrown by authorizeXAccess() functions below. Callers map this to an HTTP
 * status (401/403/404) — never a generic 500, and never anything that
 * echoes internal detail back to the client (see message text, which is
 * always safe to return as-is).
 */
export class AuthorizationError extends Error {
  status: 401 | 404;
  constructor(message: string, status: 401 | 404) {
    super(message);
    this.status = status;
  }
}

/**
 * Re-validates the session cookie INSIDE the route/action itself, instead
 * of relying solely on proxy.ts (Next.js "Proxy", the global gate). This is
 * defense-in-depth, not redundancy-for-its-own-sake: proxy.ts's matcher is
 * the only thing standing between an unauthenticated request and this code
 * today, and a future edit to that matcher (or any code path that calls
 * this logic outside of an HTTP request, e.g. a script) must not silently
 * skip authentication. Object-access functions below call this FIRST, then
 * fetch the object, then return it — decryption always happens strictly
 * after both checks, never before.
 *
 * This app has a single shared office PIN with no per-user identity (see
 * lib/auth.ts) — there is no concept of "this document belongs to this
 * user" to check. "Authorization" in this model can only assert (a) the
 * caller holds a currently-valid session and (b) the requested object
 * actually exists, which is exactly what the functions below do. This is a
 * deliberate, documented limitation of the single-office deployment model,
 * not an oversight — do not add fake per-user ownership checks that this
 * app has no way to enforce honestly.
 */
async function assertAuthenticated(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    throw new AuthorizationError("Sesi tidak valid atau sudah kedaluwarsa.", 401);
  }
}

/**
 * AUTHENTICATE -> AUTHORIZE OBJECT -> return metadata. Callers decrypt only
 * after this resolves successfully (see app/api/documents/[id]/route.ts).
 */
export async function authorizeDocumentAccess(documentId: string) {
  await assertAuthenticated();
  const doc = await prisma.customerDocument.findUnique({ where: { id: documentId } });
  if (!doc) {
    throw new AuthorizationError("Dokumen tidak ditemukan.", 404);
  }
  return doc;
}
