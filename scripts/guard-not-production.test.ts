import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * DEPLOY-001 (security hardening pass) — black-box test of the actual guard
 * script wired into package.json's `predev`/`predev:lan` npm hooks
 * (scripts/guard-not-production.js), which is what stops `npm run dev`/
 * `dev:lan` from accidentally running on a machine whose shell still has
 * NODE_ENV=production set (e.g. left over from `npm run up`).
 */
const guardScript = path.join(process.cwd(), "scripts", "guard-not-production.js");

describe("DEPLOY-001: production build does not use dev mode", () => {
  it("exits non-zero and refuses to proceed when NODE_ENV=production", () => {
    expect(() =>
      execFileSync("node", [guardScript], { env: { ...process.env, NODE_ENV: "production" } })
    ).toThrow();
  });

  it("exits 0 (allows dev server to start) when NODE_ENV is not production", () => {
    expect(() =>
      execFileSync("node", [guardScript], { env: { ...process.env, NODE_ENV: "development" } })
    ).not.toThrow();

    const { NODE_ENV: _unused, ...envWithoutNodeEnv } = process.env;
    void _unused;
    expect(() =>
      execFileSync("node", [guardScript], { env: envWithoutNodeEnv as NodeJS.ProcessEnv })
    ).not.toThrow();
  });
});
