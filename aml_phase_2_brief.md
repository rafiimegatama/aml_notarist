# aml_notarist — Phase 2 Remediation: Claude Code Implementation Brief

## How to use this
Paste this as your first message to Claude Code inside the `aml_notarist` repo, or save it as `ROADMAP-PHASE2.md` in the repo root and tell Claude Code: *"Follow ROADMAP-PHASE2.md, start from Phase 0."*

## Context for Claude Code — read before writing any code
Read, in this order:
1. `PRD-Notary-CDD-Phase2-Improvements.md` — the full Phase 2 spec. This brief sequences a subset of it by risk; it does not replace it.
2. `claude.md` — v1 build log and established patterns.
3. `reference-data.md` — source of truth for form fields.
4. `lib/status.ts` — core status/completion logic.
5. `package.json` — confirm current dependencies and test setup before assuming anything is missing.

This is a single-notary, local-first Next.js + Prisma + SQLite compliance tool for Indonesian AML/CDD. It is already in use on real client data — at least one live corporate case is currently stuck on a known gap. Treat every change as touching production data, not a demo.

## Why this order — audit basis
An external audit scored the current codebase ~35/100 overall (High-Risk Prototype tier), driven almost entirely by three dimensions: **Security (25/100** — active data-exposure bug), **Data Protection (20/100** — zero encryption at rest for KTP/NIK), and **Reliability (15/100** — zero backup). This brief fixes those first because they carry the most legal and client-trust risk per hour of engineering time — not because they're the most interesting to build. UX/compliance polish (the PRD's FR-3, FR-4) comes after, once the app is safe to keep running on live data.

## Quick-reference: effort vs risk addressed

| Phase | Item | Effort | Risk addressed | Audit dimension |
|---|---|---|---|---|
| 1 | Network binding fix | XS | Active data exposure to any device on office WiFi | Security |
| 2 | PIN gate + lockout | S | Walk-up access to all client PII | Security |
| 3 | Encrypt PII at rest | S–M | Plaintext KTP/NIK sitting on disk | Data Protection |
| 4 | Manual backup button only | M | Single point of failure, zero disaster recovery | Reliability |
| 5 | EDD gap disclosure banner | XS | Silent dead-end on a live corporate case | Compliance (interim) |
| 6 | Test coverage + CI | S–M | Zero verification on core compliance logic | Testing/QA |

## Non-negotiable constraints — apply to every phase
- **Never block the notary's core workflow.** New code must fail gracefully and log, matching the existing pattern (see the `document.ts` comment on why OCR failure must never block the notary).
- **Local-first, offline-tolerant.** Every fix below must keep working with zero internet connection unless the phase explicitly says otherwise.
- **No multi-user/accounts.** Single shared PIN only. Do not build login, roles, or per-user identity, even if it looks convenient mid-implementation.
- **Do not attempt FR-2A or the full FR-2B EDD form.** Both are blocked on data only the notary/product owner can supply (see PRD Section 7, Open Questions). This brief ships only the interim disclosure banner for 2B — nothing else.
- **Stop after each phase.** Summarize the diff and any assumption you made, then wait for confirmation before starting the next phase. Do not chain multiple phases in one uninterrupted session.

---

## Phase 1 — Close the active data exposure (FR-6A)
**Effort: XS. Do this before anything else — every later phase assumes the network layer is already closed.**

- Change the `package.json` scripts:
  - `"dev": "next dev -H 127.0.0.1"`
  - `"start": "next start -H 127.0.0.1"`
- **Acceptance criteria:** the app is unreachable from any device other than the host PC (verify by trying to load the dashboard from a phone on the same WiFi — it should fail to connect).

## Phase 2 — Lightweight access control (FR-6B)
**Effort: S.**

- One shared PIN (4–6 digits), hashed — not plaintext — stored in an env var or a single-row local config table.
- Enforce via Next.js `middleware.ts` across all routes, including `/api/documents/[id]`.
- Correct PIN → HttpOnly session cookie, default 8-hour session. **This is an assumption — flag it to the notary and confirm the preferred duration rather than treating 8 hours as final.**
- 3 consecutive wrong attempts → 5-minute lockout; failed-attempt counter resets on success or on cooldown expiry.
- Document the manual PIN-recovery path (reset the value directly in local config) in `SETUP.md`. No automated recovery flow — that's by design, not an oversight.
- **Acceptance criteria:** every route redirects to a lock screen until the correct PIN is entered; lockout triggers correctly after 3 fails; session persists across a page refresh within the window.

## Phase 3 — Encrypt PII at rest (subset of FR-5)
**Effort: S–M.**

- Encrypt on write in `uploadAndExtractDocument` (`lib/actions/document.ts`); decrypt on read in `app/api/documents/[id]/route.ts`.
- Use Node's built-in `crypto` module (AES-256-GCM) — no new heavy dependency, consistent with the project's minimal-deps footprint.
- Key comes from an env var. It must **not** be committed and must **not** live inside the SQLite DB itself.
- **Residual risk to document, not to oversell as solved:** on a single-PC app, the encryption key still lives on the same disk as the data (e.g. in `.env`). This raises the bar against "someone copies the folder" but not against "someone has full access to the PC itself." State this plainly in `SETUP.md` rather than implying the PII is now fully protected.
- **Acceptance criteria:** a raw file in `storage/uploads/` is unreadable outside the app; the existing OCR/display flow still works end-to-end after adding decrypt-on-read.

## Phase 4 — Minimum viable backup (subset of FR-1)
**Effort: M — deliberately scoped down from the full FR-1.**

- Ship **only FR-1.1**: a manual "Backup Now" button that bundles `dev.db` + `storage/uploads/` into a timestamped zip.
- **Do not build FR-1.2 (HDD auto-sync), FR-1.3 (Sheets export), or FR-1.4 (Drive backup) in this phase.** Those are blocked on decisions only the notary/product owner can make — which Google account should own the backup, what drive letter the external HDD mounts to (see PRD Section 7, Open Questions). Ask for those answers rather than guessing a business decision.
- **Acceptance criteria:** the button produces a restorable zip in under ~10 seconds for realistic data volumes; a "last successful backup" timestamp is visible in the UI so silence is never mistaken for success.

## Phase 5 — Disclose the Korporasi/LA EDD gap (interim slice of FR-2B only)
**Effort: XS.**

- Add a banner on the customer detail page, shown when `type !== PERORANGAN && riskCategory === 'TINGGI'`, stating that EDD for this client type must be handled manually outside the app until the official field list is sourced.
- **Do not build the actual EDD form/schema in this phase.** That is the full FR-2B and remains blocked on the field-list source (PRD Section 7).
- **Acceptance criteria:** the banner appears only for the correct customer-type + risk-category combination; the wording reads clearly as a manual-process instruction, not as an error state.

## Phase 6 — Minimum test coverage + CI (audit addition — not in the original PRD)
**Effort: S–M.**

- Check `package.json` first. If a test runner is already configured, use it; otherwise add Vitest — lighter and faster to wire into an existing Next.js/TS project with no prior test debt.
- Priority test targets, in this order:
  1. `computeAndPersistStatus()` in `lib/status.ts` — every branch of `cddComplete` / `riskComplete` / `eddOk`, including the hard-coded `false` path for Korporasi/LA.
  2. The risk-scoring calculation logic.
  3. The new Phase 1–5 code: PIN verification, the encrypt/decrypt round-trip, backup-zip integrity.
- Add a GitHub Actions workflow that runs lint + tests on push. **Note:** since this app deploys to one local PC and not the cloud, this CI exists to catch regressions during development, not to gate a deployment — don't build cloud-deploy steps into it.
- **Acceptance criteria:** `computeAndPersistStatus` has coverage for every status-determining branch; CI runs green on current `main`.

---

## After Phase 6
Phases 1–6 should move the audit score from ~35/100 into roughly the 65–70 range — "deployable with documented residual risk" rather than "high-risk prototype." The PRD's FR-3 (OCR field-state UX) and FR-4 (completion checklist) are the natural next phase: they're already fully specified in `PRD-Notary-CDD-Phase2-Improvements.md`, so pull the brief directly from there instead of re-writing it here.