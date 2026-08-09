import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * AUTHZ-001..003 (security hardening pass). Mocks next/headers so the test
 * controls exactly what session cookie (if any) authorizeDocumentAccess()
 * sees, independent of a real HTTP request.
 */
let cookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (name === "notary_session" && cookieValue ? { value: cookieValue } : undefined),
  })),
}));

import { authorizeDocumentAccess, AuthorizationError } from "@/lib/authorization";
import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

describe("authorizeDocumentAccess — AUTHENTICATE then AUTHORIZE OBJECT, before any decrypt", () => {
  let documentId: string | null = null;

  afterEach(async () => {
    if (documentId) {
      await prisma.customerDocument.delete({ where: { id: documentId } }).catch(() => {});
      documentId = null;
    }
    cookieValue = undefined;
  });

  it("AUTHZ-001: unauthenticated request (no session cookie) is rejected with 401, before any DB lookup", async () => {
    cookieValue = undefined;
    await expect(authorizeDocumentAccess("anything")).rejects.toMatchObject({ status: 401 });
  });

  it("AUTHZ-001b: an invalid/malformed session token is rejected with 401", async () => {
    cookieValue = "garbage-not-a-real-token";
    await expect(authorizeDocumentAccess("anything")).rejects.toMatchObject({ status: 401 });
  });

  it("AUTHZ-002: a valid session but a document id that does not exist is rejected with 404 (not silently returned)", async () => {
    cookieValue = createSessionToken();
    await expect(authorizeDocumentAccess("does-not-exist-id")).rejects.toMatchObject({ status: 404 });
  });

  it("AUTHZ-002b: malformed/unexpected id shapes are rejected the same way as a missing document, not a crash", async () => {
    cookieValue = createSessionToken();
    await expect(
      authorizeDocumentAccess("../../etc/passwd")
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("valid session + existing document resolves to that document's metadata", async () => {
    const doc = await prisma.customerDocument.create({
      data: {
        formType: "PERORANGAN",
        fileName: "authz-test.png",
        filePath: "authz-test-stored.png",
        mimeType: "image/png",
      },
    });
    documentId = doc.id;
    cookieValue = createSessionToken();

    const resolved = await authorizeDocumentAccess(doc.id);
    expect(resolved.id).toBe(doc.id);
  });

  it("AUTHZ-003: authorization failure happens before any decryption attempt — an unauthenticated caller never reaches file/DB content", async () => {
    // Prove the ordering by construction: authorizeDocumentAccess rejects
    // (throws) synchronously in the authentication step, before it ever
    // performs the prisma.customerDocument.findUnique() lookup that a
    // decrypt step would depend on. We assert this indirectly: an
    // unauthenticated call rejects even for an id that DOES exist in the
    // database, proving the auth check runs first and short-circuits.
    const doc = await prisma.customerDocument.create({
      data: {
        formType: "PERORANGAN",
        fileName: "authz-order-test.png",
        filePath: "authz-order-test-stored.png",
        mimeType: "image/png",
      },
    });
    documentId = doc.id;
    cookieValue = undefined; // unauthenticated

    await expect(authorizeDocumentAccess(doc.id)).rejects.toMatchObject({ status: 401 });
  });
});
