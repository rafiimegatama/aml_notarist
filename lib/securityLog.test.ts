import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

/**
 * LOG-001 (security hardening pass). Redirects SECURITY_LOG_PATH to a temp
 * file for this whole test file so logSecurityEvent()/getSecurityEvents()
 * exercise their REAL implementation without ever appending test noise to
 * a real notary's storage/security.log.
 */
const tempDir = await mkdtemp(path.join(tmpdir(), "notary-securitylog-test-"));
const tempLogPath = path.join(tempDir, "security.log");

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>();
  return { ...actual, SECURITY_LOG_PATH: tempLogPath };
});

const { logSecurityEvent, getSecurityEvents } = await import("@/lib/securityLog");

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("LOG-001: security log never contains sensitive values", () => {
  afterEach(async () => {
    await rm(tempLogPath, { force: true });
  });

  it("round-trips a benign event and the stored shape has no field for structured secrets", async () => {
    await logSecurityEvent("LOGIN_SUCCESS");
    const events = await getSecurityEvents();
    expect(events[0]).toHaveProperty("ts");
    expect(events[0]).toHaveProperty("type", "LOGIN_SUCCESS");
    expect(Object.keys(events[0]).every((k) => ["ts", "type", "detail"].includes(k))).toBe(true);
  });

  it("verifyPin() never passes the PIN value itself to logSecurityEvent (static source check)", () => {
    const authActionsPath = path.join(process.cwd(), "lib", "actions", "auth.ts");
    const source = readFileSync(authActionsPath, "utf-8");
    const calls = source.match(/logSecurityEvent\([^)]*\)/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      // Matches a bare `pin` identifier used as an argument (not as part of
      // a longer identifier like `pinResetToken` or inside a string literal
      // like "PIN salah").
      expect(call).not.toMatch(/\bpin\b/);
    }
  });

  it("logSecurityEvent's detail parameter is a plain string, not a structured object that could carry secret fields", async () => {
    // TypeScript already enforces this at compile time (detail?: string) —
    // this is a runtime characterization test documenting the contract so a
    // future refactor to accept `unknown`/objects doesn't silently reopen
    // the door to logging full request bodies.
    await logSecurityEvent("LOGOUT", "plain string detail only");
    const events = await getSecurityEvents();
    expect(typeof events[0].detail === "string" || events[0].detail === undefined).toBe(true);
  });
});
