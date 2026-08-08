# Strix scan scope — notary_aml

Pass this file via `--instruction-file security/strix-scan-instructions.md`.

## App model (read before scanning)

This is a **single-tenant, local-first** Next.js/Prisma/SQLite compliance
tool for one Indonesian notary office. There is exactly **one shared PIN**
(4-6 digits, hashed) for the whole office — see `lib/auth.ts` and
`proxy.ts`. There is **no user model, no accounts, no roles, no RBAC, no
multi-tenancy**. The app binds to `127.0.0.1` only (not exposed to the
network). It stores real client PII: KTP/NIK scans (encrypted at rest with
AES-256-GCM as of `lib/documentEncryption.ts`), names, addresses, financial
data for AML/CDD risk assessment.

## Scope for this run: SOURCE CODE ONLY (white-box)

Target is the local repository (`-t ./`), not a running instance. Do not
attempt to start the dev/prod server or connect to a live instance during
this scan — no live/black-box testing this round.

## In scope — test for these, they are real given the actual auth model

- **PIN gate coverage**: does every route that should require a session
  actually require one? Check `proxy.ts`'s matcher regex for gaps — a route
  accidentally excluded from the PIN gate is a real, direct vulnerability
  here (see `lib/documentEncryption.ts`-protected uploads, `/api/documents/[id]`,
  `/api/backup/[filename]`, `/api/ltkm-export`, admin pages).
- **Session token integrity**: forgery, signature bypass, or expiry bypass
  of the HMAC-signed session/PIN-reset tokens in `lib/auth.ts`
  (`isValidSignedExpiring`, `createSessionToken`, `createPinResetToken`).
- **PIN comparison / brute-force resistance**: timing side channels on PIN
  verification (`verifyPinHash`), lockout bypass or reset logic
  (`recordFailedAttempt`/`resetLockout`/`getLockoutStatus` — in-memory,
  single-process by design, but check if the counter is genuinely tied to
  attempts or can be raced/bypassed).
- **Server Actions reachability**: any exported function in a `"use server"`
  file (`lib/actions/*.ts`) that trusts an argument for filesystem paths,
  SQL-adjacent Prisma queries, or shell execution without validating it —
  Server Actions are directly POST-able with attacker-controlled arguments
  regardless of what the UI sends. (A real instance of exactly this class of
  bug was found and fixed in `lib/actions/backup.ts` during this session —
  look for siblings of that pattern across `lib/actions/`.)
- **Path traversal / arbitrary file read**: file-serving routes
  (`app/api/documents/[id]/route.ts`, `app/api/backup/[filename]/route.ts`,
  `app/api/hero-image/route.ts`) — confirm filenames are always
  server-generated (UUID/regex-validated) and never taken from user input
  unsanitized.
- **Document encryption boundary**: can `lib/documentEncryption.ts`
  ciphertext be decrypted, or the key derived, from anything other than
  `SESSION_SECRET`? Is there any code path that logs, returns, or exposes
  decrypted document bytes or the raw key outside the intended read path?
- **OAuth "Lupa PIN" flow** (`lib/actions/pinRecovery.ts`,
  `app/api/auth/google/*`): CSRF on the state parameter, email-allowlist
  bypass (`PIN_RECOVERY_GOOGLE_EMAIL` matching), token reuse/replay.
- **Injection**: standard SQLi/command-injection/XXE sweep of any raw SQL,
  shell exec, or XML parsing (Prisma is used almost everywhere, so this is
  mostly about the few places that touch the filesystem or shell — e.g.
  `lib/actions/backup.ts`, `scripts/`, PDF/CSV export code).
- **CSV/PDF export injection**: `lib/ltkmCsv.ts`, Google Sheets export code
  — formula/CSV injection into exported files opened in Excel.

## Explicitly OUT of scope — do not report these

- **RBAC, privilege escalation between roles, IDOR between users/tenants** —
  there is exactly one shared credential and no user/role model at all.
  Findings phrased as "any authenticated user can access another user's
  data" are not meaningful here; there is only one authenticated principal
  (the PIN holder) by design.
- **Rate limiting / DoS / resource exhaustion.**
- **Missing MFA, missing password complexity rules, missing account lockout
  policies beyond the 3-attempt/5-minute one already implemented** — this
  is a shared office PIN, not a per-user credential; standard multi-user
  auth hardening advice does not apply.
- **Network-exposure findings** that assume the app is reachable beyond
  `127.0.0.1` — it is bound to localhost only by design (`package.json`
  scripts use `-H 127.0.0.1`).
- **Any live/dynamic exploitation** — this run is source-only. Do not spin
  up the app or touch `prisma/dev.db` / `storage/`.
- **Third-party dependency CVEs** — tracked separately (`npm audit`).

## Output

Standard Strix report format (`penetration_test_report.md` +
`vulnerabilities/*.md` + SARIF). Flag confidence explicitly — this repo
already went through one internal security-review pass on the latest
session's diff (see `CLAUDE.md` v2-fase7/fase8 changelog entries), so
false-positive discipline matters more than volume here.
