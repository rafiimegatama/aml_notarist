import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * AUTH-001..004 (security hardening pass). Mocks next/headers (cookie jar),
 * next/navigation (redirect), lib/securityLog (so tests never write to the
 * real storage/security.log) and lib/pinSettings (so tests never touch the
 * real AppSetting table / a real notary's configured PIN). This isolates
 * the actual PIN-verification/session/lockout logic under test from I/O
 * that would otherwise mutate shared state.
 */
type CookieRecord = { value: string };
const cookieJar = new Map<string, CookieRecord>();
const redirectCalls: unknown[][] = [];
const loggedEvents: Array<{ type: string; detail?: string }> = [];
let effectivePinHash: string | null = null;

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (name: string, value: string) => {
      cookieJar.set(name, { value });
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    redirectCalls.push(args);
  },
}));

vi.mock("@/lib/securityLog", () => ({
  logSecurityEvent: vi.fn(async (type: string, detail?: string) => {
    loggedEvents.push({ type, detail });
  }),
}));

vi.mock("@/lib/pinSettings", () => ({
  getEffectivePinHash: vi.fn(async () => effectivePinHash),
  setPinHash: vi.fn(async () => {}),
}));

import { verifyPin, logout } from "@/lib/actions/auth";
import { LOCKOUT_THRESHOLD, SESSION_COOKIE_NAME, hashPin, resetLockout } from "@/lib/auth";

const REAL_PIN = "246810";

describe("AUTH-001: invalid PIN rejected", () => {
  beforeEach(() => {
    cookieJar.clear();
    redirectCalls.length = 0;
    loggedEvents.length = 0;
    resetLockout();
    effectivePinHash = hashPin(REAL_PIN);
  });

  it("rejects a wrong PIN and does not set a session cookie", async () => {
    const result = await verifyPin("000000");
    expect(result.success).toBe(false);
    expect(cookieJar.has(SESSION_COOKIE_NAME)).toBe(false);
    expect(loggedEvents.some((e) => e.type === "LOGIN_FAILED")).toBe(true);
  });

  it("accepts the correct PIN and sets a session cookie", async () => {
    const result = await verifyPin(REAL_PIN);
    expect(result.success).toBe(true);
    expect(cookieJar.has(SESSION_COOKIE_NAME)).toBe(true);
    expect(loggedEvents.some((e) => e.type === "LOGIN_SUCCESS")).toBe(true);
  });
});

describe("AUTH-002: repeated failed PIN triggers lockout", () => {
  beforeEach(() => {
    cookieJar.clear();
    loggedEvents.length = 0;
    resetLockout();
    effectivePinHash = hashPin(REAL_PIN);
  });
  afterEach(() => resetLockout());

  it("locks out after LOCKOUT_THRESHOLD consecutive failures, and even a correct PIN is rejected while locked", async () => {
    for (let i = 0; i < LOCKOUT_THRESHOLD - 1; i++) {
      const r = await verifyPin("000000");
      expect(r.success).toBe(false);
    }
    const lockingAttempt = await verifyPin("000000");
    expect(lockingAttempt.success).toBe(false);
    if (!lockingAttempt.success) {
      expect(lockingAttempt.error).toMatch(/terkunci/i);
    }
    expect(loggedEvents.some((e) => e.type === "LOCKOUT_TRIGGERED")).toBe(true);

    // Correct PIN is still rejected — lockout blocks ALL attempts, not just wrong ones.
    const stillLocked = await verifyPin(REAL_PIN);
    expect(stillLocked.success).toBe(false);
    expect(cookieJar.has(SESSION_COOKIE_NAME)).toBe(false);
  });
});

describe("AUTH-004: logout invalidates session", () => {
  beforeEach(() => {
    cookieJar.clear();
    redirectCalls.length = 0;
    loggedEvents.length = 0;
    resetLockout();
    effectivePinHash = hashPin(REAL_PIN);
  });

  it("deletes the session cookie and redirects to /lock", async () => {
    await verifyPin(REAL_PIN);
    expect(cookieJar.has(SESSION_COOKIE_NAME)).toBe(true);

    await logout();

    expect(cookieJar.has(SESSION_COOKIE_NAME)).toBe(false);
    expect(redirectCalls).toContainEqual(["/lock"]);
    expect(loggedEvents.some((e) => e.type === "LOGOUT")).toBe(true);
  });
});

// AUTH-003 (expired session rejected) is covered at the actual enforcement
// point — isValidSessionToken()'s expiry check — in lib/auth.test.ts
// ("rejects an expired token"), which is what both proxy.ts and any
// defense-in-depth re-check (lib/authorization.ts) call.
