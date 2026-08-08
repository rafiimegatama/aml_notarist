import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LOCKOUT_DURATION_MINUTES,
  LOCKOUT_THRESHOLD,
  createOAuthState,
  createPinResetToken,
  createSessionToken,
  getLockoutStatus,
  getSessionExpiryMs,
  hashPin,
  isValidOAuthState,
  isValidPinResetToken,
  isValidSessionToken,
  recordFailedAttempt,
  resetLockout,
  verifyPinHash,
} from "@/lib/auth";

describe("hashPin / verifyPinHash", () => {
  it("hashes deterministically and verifies a matching PIN", () => {
    const hash = hashPin("123456");
    expect(verifyPinHash("123456", hash)).toBe(true);
  });

  it("rejects a wrong PIN", () => {
    const hash = hashPin("123456");
    expect(verifyPinHash("654321", hash)).toBe(false);
  });

  it("rejects when no PIN is configured yet (configuredHash null)", () => {
    expect(verifyPinHash("123456", null)).toBe(false);
  });
});

describe("session token (Phase 2 — FR-6B)", () => {
  it("a freshly created session token is valid", () => {
    const token = createSessionToken();
    expect(isValidSessionToken(token)).toBe(true);
  });

  it("rejects undefined / malformed tokens", () => {
    expect(isValidSessionToken(undefined)).toBe(false);
    expect(isValidSessionToken("not-a-real-token")).toBe(false);
    expect(isValidSessionToken("session:123.abc")).toBe(false);
  });

  it("rejects a token with extra characters appended to the signature (regression: Buffer.from hex silently truncates odd trailing chars — see claude.md history)", () => {
    const token = createSessionToken();
    const [payload, signature] = token.split(".");
    expect(isValidSessionToken(`${payload}.${signature}Z`)).toBe(false);
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    try {
      const token = createSessionToken();
      vi.advanceTimersByTime(11 * 60 * 60 * 1000); // past the 10h session duration
      expect(isValidSessionToken(token)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("getSessionExpiryMs returns the expiry only for a valid token", () => {
    const token = createSessionToken();
    const exp = getSessionExpiryMs(token);
    expect(exp).not.toBeNull();
    expect(exp!).toBeGreaterThan(Date.now());
    expect(getSessionExpiryMs("garbage")).toBeNull();
  });
});

describe("PIN reset token (Lupa PIN flow)", () => {
  it("a freshly created reset token is valid and distinct from a session token", () => {
    const resetToken = createPinResetToken();
    expect(isValidPinResetToken(resetToken)).toBe(true);
    // Prefix-tagged — a session token must never validate as a reset token.
    expect(isValidPinResetToken(createSessionToken())).toBe(false);
  });
});

describe("OAuth state (anti-CSRF double-submit cookie)", () => {
  it("matches only when cookie and query values are identical", () => {
    const state = createOAuthState();
    expect(isValidOAuthState(state, state)).toBe(true);
    expect(isValidOAuthState(state, createOAuthState())).toBe(false);
  });

  it("rejects when either side is missing", () => {
    const state = createOAuthState();
    expect(isValidOAuthState(undefined, state)).toBe(false);
    expect(isValidOAuthState(state, undefined)).toBe(false);
  });
});

describe("lockout state machine (3 fails / 5 min, FR-6B)", () => {
  afterEach(() => {
    resetLockout();
    vi.useRealTimers();
  });

  it("stays unlocked below the threshold", () => {
    for (let i = 0; i < LOCKOUT_THRESHOLD - 1; i++) recordFailedAttempt();
    expect(getLockoutStatus().locked).toBe(false);
  });

  it("locks exactly at the threshold", () => {
    for (let i = 0; i < LOCKOUT_THRESHOLD; i++) recordFailedAttempt();
    const status = getLockoutStatus();
    expect(status.locked).toBe(true);
    expect(status.remainingMs).toBeGreaterThan(0);
  });

  it("auto-unlocks once the cooldown window passes", () => {
    vi.useFakeTimers();
    for (let i = 0; i < LOCKOUT_THRESHOLD; i++) recordFailedAttempt();
    expect(getLockoutStatus().locked).toBe(true);
    vi.advanceTimersByTime((LOCKOUT_DURATION_MINUTES * 60 + 1) * 1000);
    expect(getLockoutStatus().locked).toBe(false);
  });

  it("resetLockout clears the failed-attempt counter (success path)", () => {
    for (let i = 0; i < LOCKOUT_THRESHOLD; i++) recordFailedAttempt();
    resetLockout();
    expect(getLockoutStatus().locked).toBe(false);
    // and the counter really reset, not just the timestamp — one more
    // failure alone should not re-lock immediately.
    recordFailedAttempt();
    expect(getLockoutStatus().locked).toBe(false);
  });
});
