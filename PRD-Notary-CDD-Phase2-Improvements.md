# PRD — Notary CDD & Risk Assessment WebApp: Phase 2 Improvements

| | |
|---|---|
| **Project** | `aml_notarist` (Notary CDD & Risk Assessment WebApp) |
| **Document type** | Product Requirements Document (planning only — no implementation yet) |
| **Prepared by** | Expert Solution Analyst session (Claude), in collaboration with product owner |
| **Date** | 2026-08-04 |
| **Status** | Draft — for review, then hand-off to Claude Code for scoped implementation |
| **Predecessor doc** | `claude.md` (v1 build log), `reference-data.md` (source of truth for form fields) |

## How to use this document

This is a **planning artifact**, not a build log. Nothing described here has been implemented. When you're ready to build a given requirement, hand the relevant `FR-#` section to Claude Code as its brief — each one includes acceptance criteria and references to the exact existing files it touches, so it can be scoped as an isolated task rather than re-discovering the codebase from scratch. Treat **Section 7 (Open Questions)** as a pre-flight checklist — several requirements are blocked on a decision or a piece of source data only you can provide.

---

## 1. Background

The existing app (v1, per `claude.md`) is a single-notary, local-only Next.js + SQLite tool covering CDD form-filling, automated risk scoring, and EDD for individuals. It was built with unusually strong traceability back to the governing regulations (PP 43/2015, Permenkumham 9/2017, Perpres 13/2018, Permenkumham 15/2019) and two **known, documented gaps**: the Business Sector risk-score table is unseeded, and there is no EDD form for high-risk Korporasi/Legal Arrangement clients.

This document captures the **Phase 2 "essential improvements"** identified in an architecture review and stakeholder brainstorm. It also captures a finding from that review that sits outside the six numbered items below but is prerequisite context for two of them: **the app currently binds to `0.0.0.0` by default** (standard Next.js behavior, since neither `next dev` nor `next start` is passed a `-H` flag in `package.json`). On the office WiFi, that means any device on the same network — including a client's phone — can reach the exact same dashboard, with no login, and browse every customer's data. This is folded into **FR-6** below as a network-layer fix that is *not* a user-authentication system, so it doesn't conflict with the "no auth layer" decision.

## 2. Goals

- Make the notary's data durable across hardware failure, without requiring her to think about backups day-to-day.
- Give the app an honest, visible answer for the two documented v1 gaps instead of a silent dead-end (DRAFT forever).
- Reduce the chance that an OCR mis-read becomes a wrong fact on a legal compliance record.
- Make it obvious, at a glance, what's left to do on any given case.
- Apply real data-protection practice to the PII (ID scans, NIK, income data) this app already collects.
- Add a walk-away-from-the-desk safeguard that doesn't require building user accounts.

## 3. Non-Goals (explicit scope exclusions)

- **Multi-user authentication, roles, or permissions.** Confirmed out of scope — single notary, single shared access gate (FR-6) only.
- **Direct goAML/PPATK API integration.** Suggested at spec level only (FR-10), not a build target this phase.
- **Automated legal determination of the Business Sector categories or the Corporate/LA EDD field list.** These must come from the notary or compliance counsel — see FR-2 and Section 7.

## Priority legend (used throughout)

| Priority | Meaning |
|---|---|
| **Must** | Blocks real compliance/operational use if missing |
| **Should** | Meaningful risk or time reduction, not blocking |
| **Could** | Worth doing if time allows; lower urgency |
| **Blocked** | Cannot start until an external decision/data input lands (see Section 7) |

---

## 4. Requirements

### FR-1 — Multi-Tier Data Backup & Flow

**Priority: Must** · Feedback source: point 1

**Problem:** `prisma/dev.db` and `storage/uploads/` live on one disk, on one PC. No backup exists today. This is single-point-of-failure risk for legally-retained records.

Rather than one mechanism, this is a layered data-flow design — local primary, then three independent, non-blocking channels outward:

| # | Layer | What it does | Trigger |
|---|---|---|---|
| 1.1 | **Manual export button (UI)** | Bundles `dev.db` + `storage/uploads/` into a single timestamped `.zip`, either downloaded via the browser or written to a configurable local backup folder | Notary clicks "Backup Now" (e.g. on the Dashboard or a new `/admin/backup` page) |
| 1.2 | **External HDD auto-sync** | On app start (and optionally a periodic in-process check), detect whether a configured backup path (e.g. `E:\notaris-backup`) currently exists/is mounted; if so, copy the latest DB + uploads over. If not mounted, skip silently and log — never block the app | HDD plugged in + app running |
| 1.3 | **Google Sheets — structured data flow** | Sync a flattened summary row per customer (name, type, risk category, status, key dates) to a Google Sheet. This already has a foundation: `lib/googleSheets/client.ts` and `lib/actions/sheetsExport.ts` exist — this elevates it from optional feature to **essential, always-on data flow** | On status change to COMPLETE, and on-demand via existing export action |
| 1.4 | **Google Drive — raw scan backup** | After a successful upload in `uploadAndExtractDocument` (`lib/actions/document.ts`), also push a copy of the raw ID photo to a dedicated Google Drive folder via a service account — same auth pattern as 1.3, just Drive scope instead of Sheets scope. Explicitly **not fancy**: no versioning, no dedup, no folder-per-client structure needed for v1, just "it exists somewhere off this PC" | Immediately after local upload succeeds, fire-and-forget (must not delay OCR or block form submission) |

**Acceptance criteria**
- Backup button produces a restorable zip (DB + uploads) in under ~10 seconds for realistic data volumes.
- HDD sync never throws an unhandled error if the drive isn't present — matches the app's existing philosophy (see `document.ts` comment: *"OCR gagal... tidak boleh memblokir notaris"*) applied to backup too.
- Sheets/Drive failures (no internet, bad credentials) degrade the same way `getSheetsConfig()` already does — return null/log, don't block the notary's actual work.
- A record of "last successful backup" (per channel) is visible somewhere in the UI, so silence isn't mistaken for success.

**Implementation note (not a build task, a heads-up for whoever implements this):** true *scheduled* backups (e.g. "every night at 2am") are more reliably done at the OS level (Windows Task Scheduler calling a small script) than inside the Next.js process itself, since `next dev`/`next start` isn't guaranteed to be running continuously or to survive a PC restart unless it's set up as a service. Recommend the in-app mechanisms (1.1, 1.2) be "on app start" + "manual button" rather than promising a precise clock-time schedule, unless an OS-level scheduler is paired with it.

**Touches:** `lib/googleSheets/client.ts`, `lib/actions/sheetsExport.ts`, `lib/actions/document.ts`, `lib/storage.ts`, `prisma/dev.db`, `storage/uploads/`. New: a Drive client module mirroring `googleSheets/client.ts`, a backup server action, a small admin UI panel.

---

### FR-2 — Close the Two Known Gaps (Business Sector Score + Corporate/LA EDD)

**Priority: Must, partially Blocked** · Feedback source: point 2 (drafted here as a formal requirement, per request)

This gap already has real teeth: per `lib/status.ts`, **any high-risk Korporasi or Legal Arrangement customer can never reach `COMPLETE` status**, automatically or manually — `eddOk` is hard-coded `false` for those types. If Dewi has live corporate clients, she is already hitting this dead end.

#### 2A. Business Sector Score Table (Tabel B)

Good news from the code review: **this is a pure data problem, not a code problem.** The admin UI already generically supports all 5 reference tables — `app/admin/referensi/page.tsx` renders `RefBusinessSectorScore` through the same `AdminRefTable` component as the other four, and `lib/refTableConfig.ts` already has the exact mechanism to flip it on:

```ts
businessSector: {
  ...
  scoreRequired: false,   // ← flip to true once real data exists
  note: "BELUM ADA DATA RESMI — lengkapi kategori dan skor di sini..."
}
```

**Requirement:** Once the notary sources the official category list + scores (from the governing regulation or PPATK guidance), they can be entered directly through the existing `/admin/referensi` UI or a seed script — **no schema change, no new UI needed.** The only code change is flipping `scoreRequired: true` in `refTableConfig.ts` once the table is populated, so the risk engine stops treating `totalScore` as provisional.

#### 2B. EDD Form for Korporasi / Legal Arrangement

Unlike 2A, this **is** a real gap: no schema, no form, no fields exist, because the source document (`reference-data.md` page 15/29 per `claude.md`) only covered the Perorangan EDD section. This cannot be designed blind — the field list must come from the regulation or the notary's own paper EDD form for corporate clients before a schema/form can be drafted.

**Requirement, once the field list is sourced:**
- New Prisma model (e.g. `HighRiskCorporateAdditionalInfo`), mirroring the shape of the existing `HighRiskAdditionalInfo`.
- Matching Zod schema + form component + server action, following the exact patterns already established for the individual EDD flow.
- Update `computeAndPersistStatus()` in `lib/status.ts` to check the new model instead of the current hard-coded `false` for non-`PERORANGAN` types.

**Interim UX fix (no data dependency — can ship immediately):** Right now, a notary looking at a stuck-in-DRAFT corporate case has no in-app explanation for *why*. Add a visible banner on the customer detail page when `type !== PERORANGAN && riskCategory === 'TINGGI'`: *"EDD Korporasi/Legal Arrangement belum tersedia di sistem — proses ini wajib ditangani manual di luar aplikasi sampai form EDD resmi tersedia."* This turns a confusing silent dead-end into a clear, documented manual process — genuinely useful on its own regardless of when 2B's data arrives.

**Touches:** `lib/refTableConfig.ts` (2A, one-line flip), `prisma/schema.prisma`, `lib/validations.ts`, `lib/status.ts`, `lib/actions/highRiskInfo.ts`, `app/cdd/[id]/edd/`, plus a new banner component on `app/cdd/[id]/page.tsx` (interim fix).

---

### FR-3 — OCR Prefill: Expert UX Recommendations

**Priority: mixed (see breakdown)** · Feedback source: point 3 (open request for UX expertise)

**What exists today, precisely:** `extractFieldGuesses()` in `lib/ocr/extractFields.ts` is a documented best-effort heuristic — it slices raw OCR text between recognized labels, deliberately skips all enum/dropdown/date fields (only free-text fields are guessed), and the code comment itself says the result *"wajib direview manual oleh notaris."* The only UI signal today is `OcrAssistBanner.tsx` — **one generic banner shown once, at the top of the form**, plus a collapsible raw-text dump. Once a guessed value lands inside an input, there is nothing distinguishing it from something the notary typed herself. Six fields later, that distinction is gone.

That gap — a real compliance risk, since a wrong OCR guess on an ID number is indistinguishable from a verified one — is what these recommendations target, roughly in priority order:

| Priority | Recommendation | Why |
|---|---|---|
| **Must** | **Three-state field styling**: Empty / *Suggested — unverified* (e.g. dashed amber border + small "OCR" tag) / *Confirmed* (neutral/solid, either typed manually or explicitly touched-and-left by the notary). State flips to Confirmed the moment the notary interacts with that specific field. | This is the core fix — cheap to build (it's UI state, the guess data already exists in `fieldGuesses`), and directly closes the "can't tell guessed from verified" gap. |
| **Must** | **Pre-submit review gate**: if any fields are still in "Suggested — unverified" state at submit time, interrupt with a lightweight, dismissable summary ("5 field belum direview: Nama Lengkap, No. Identitas... — Tinjau sekarang / Tandai semua sudah benar") rather than letting the form save silently. | Matches the existing non-blocking philosophy (dismissable, not a hard stop) while making sure "I forgot to check" isn't a silent failure mode on a legal document. |
| **Should** | **Confidence-aware flagging.** Tesseract.js's `recognize()` actually returns per-word confidence in `data.words` — `runOcr.ts` currently discards everything except the concatenated `text`. Capturing word-level confidence and mapping it back to each guessed field's character range (matching the guessed substring against consecutive words) would let low-confidence guesses render more assertively (e.g. red vs. amber) than high-confidence ones. | Real, available signal that's currently thrown away. Non-trivial (needs offset-to-word mapping) — right-sized as Phase 2, not a v1-blocking fix. |
| **Should** | **Source-image snippet next to critical fields.** For identity-critical fields specifically (name, ID number, date of birth), show a small cropped preview of the source scan beside the field so the notary can visually cross-check without switching tabs or scrolling to the OCR raw-text dump. | Standard pattern in professional KYC/ID-review tooling; most valuable exactly where OCR errors are costliest (identity fields), so it doesn't need to apply to every field. |
| **Could** | **Overwrite memory.** If a notary edits an OCR-suggested value, keep the original guess retrievable via a small tooltip ("OCR awalnya: ..."), in case of an accidental overwrite. | Cheap safety net, not essential. |
| **Could** | **Learning loop** (e.g. tracking which label-matches are reliably correct over time to boost future confidence). | Interesting, but overkill for a single-notary tool at this stage — noted for completeness, not recommended for this phase. |

**Touches:** `components/forms/OcrAssistBanner.tsx` (extend/replace), `lib/ocr/extractFields.ts`, `lib/ocr/runOcr.ts` (to preserve word confidence), `components/forms/IndividualForm.tsx` / `CorporateForm.tsx` / `LegalArrangementForm.tsx` (field-level state), `lib/ocr/applyFieldGuesses.ts`.

---

### FR-4 — Section Completion Checklist

**Priority: Should** · Feedback source: point 4 (detailed per request)

**Problem:** Status today is binary — `DRAFT` or `COMPLETE` — collapsed from three checks already computed in `computeAndPersistStatus()` (`lib/status.ts`): `cddComplete`, `riskComplete`, `eddOk`. A case sitting in DRAFT gives no hint *which* of those is unmet without the notary hunting through the whole page.

**Detailed spec:**

1. **Refactor, not rebuild.** `computeAndPersistStatus()` already computes the three booleans needed — it just discards them into one final value. Expose a companion function (e.g. `getCompletionBreakdown(customerId)`) that returns the granular state instead of (or alongside) the collapsed status, so this is additive, not a rewrite of working logic.

2. **Per-case checklist widget**, shown at the top of `app/cdd/[id]/page.tsx`:

   | Section | Possible states |
   |---|---|
   | CDD Dasar (Corporate/Individual/LA detail) | Not filled / Filled |
   | Power of Attorney *(Korporasi only)* | Not filled / Filled |
   | Beneficial Owner | None added *(informational — schema allows zero)* / N added |
   | Notary Service Info | Not filled / Filled |
   | Risk Assessment | Not started / PEP section only / Scoring done → shows category |
   | EDD *(only rendered if riskCategory = TINGGI)* | Not applicable / Required — not filled / Filled *(Perorangan)* / Manual process required *(Korporasi/LA — links to the FR-2 interim banner)* |

   A simple "4/6 lengkap" progress readout plus per-row check/cross icons; each row can jump-link to that section of the (already single-page) detail view.

3. **Dashboard-level hint.** On `app/page.tsx`, the Status column already shows DRAFT/COMPLETE — add a hover/tap tooltip on DRAFT rows listing exactly what's outstanding (e.g. "Menunggu: Risk Assessment, EDD"), reusing the same breakdown function from step 1. Keep this to a tooltip, not a new column — the dashboard table is already fairly wide.

**Acceptance criteria**
- Checklist state is always derived from the same source of truth as `Customer.status` (no second, divergent completeness calculation).
- Adding this must not change existing status-computation behavior — it's a read/display layer on top.

**Touches:** `lib/status.ts` (add breakdown function), `app/cdd/[id]/page.tsx` (new widget), `app/page.tsx` (tooltip), possibly a new small component under `components/detail/`.

---

### FR-5 — PII Retention: Best Practices (decision: keep archive)

**Priority: Must (baseline) / Should (hardening)** · Feedback source: point 5

You've decided to keep the archive rather than purge it, for regulatory reasons — that's a reasonable default for a compliance record-keeper. Here's what "keep it responsibly" should mean in practice, grounded in what actually applies to this data:

1. **The retention duration should be explicit, not implicit-forever.** Professional commentary on PP No. 43/2015 and Permenkumham No. 9/2017 (published by Ikatan Notaris Indonesia) states that completed CDD forms must be kept/managed by the notary for **5 years**. Treat this as a starting figure to confirm against the primary regulation text with your own compliance/legal reference, not as something to hard-code from this document — but it gives a concrete number to design around (e.g. a `retentionReviewDate` flag) rather than "forever" as the only option.

2. **Encryption and access control aren't optional extras — they're a legal expectation.** Indonesia's Personal Data Protection Law (UU No. 27/2022, "UU PDP") requires data controllers to apply adequate technical and organizational security measures for personal data — commonly interpreted to include encryption and layered access control — and to report a data breach to affected individuals and the supervisory authority within 3×24 hours of discovery. This app stores NIK/KTP scans and income data, which squarely qualifies. Concretely:
   - **Floor:** OS-level full-disk encryption (BitLocker on Windows) on the notary's PC — cheap, immediate, non-negotiable given the above.
   - **Better:** application-level encryption of the `storage/uploads/` directory specifically (encrypt on write in `uploadAndExtractDocument`, decrypt on read in the `/api/documents/[id]` route) so a copied folder alone isn't readable. Flag as a Should, not a v1 blocker.
   - **Backups inherit the same obligation.** Once FR-1's HDD/Drive backup exists, an unencrypted KTP photo sitting in a personal Google Drive is arguably a *bigger* leak surface than the original file. Use a dedicated (not personal) Google account for backup, with sharing locked down, and prefer encrypting before upload.

3. **Distinguish the record from the raw photo.** The *structured* CDD data (names, ID numbers, dates) is almost certainly what the retention duty is actually about. Whether the *original scanned photo* needs the same multi-year retention once its fields are confirmed and archived — or whether it could be purged sooner while the confirmed data stays — is a real question worth putting to legal counsel rather than assuming either answer. Don't automate a decision here; just make the record and the image separately reviewable.

4. **When retention ends, make deletion a documented manual step, not an automatic one for v1.** A "flag records past their retention-review date" report is safer than an automatic purge job you can't easily audit or reverse.

**Touches:** `lib/storage.ts`, `app/api/documents/[id]/route.ts`, `lib/actions/document.ts`, plus whatever encryption-at-rest/OS config lives outside the repo entirely.

---

### FR-6 — Local Access Control (Network Binding + PIN Gate)

**Priority: Must** · Feedback source: point 6, plus the network-exposure finding from the earlier review

Two independent, complementary layers — neither is a user-authentication system:

#### 6A. Network binding fix (already specified, cheap, do first)

`package.json` currently runs `next dev` / `next start` with no `-H` flag, which defaults to `0.0.0.0` — reachable from any device on the same WiFi, including a client's phone, with zero login, seeing every customer's data via the dashboard. Fix:

```json
"dev": "next dev -H 127.0.0.1",
"start": "next start -H 127.0.0.1",
```

This alone stops *network* access from outside the PC. It does not protect someone standing at the PC itself — that's what 6B is for.

#### 6B. Lightweight PIN gate

- **One shared PIN** (4–6 digits), not a user account — no username, no roles, no per-person identity. Stored as a hash (not plaintext), e.g. in an env var or a single-row local config table.
- Enforced via Next.js **middleware** across all routes except the lock screen itself, so it also covers the `/api/documents/[id]` scan-viewing route.
- Correct PIN → sets an HttpOnly session cookie, valid for a working day (proposed default: 8–12 hours, or "until midnight") so the notary isn't re-entering it constantly — **flagging this duration as an assumption to confirm**, not a fixed requirement.
- **3-attempt lockout** (per your request): after 3 consecutive wrong entries, block further attempts for a cool-down period. Proposed default: **5 minutes**, with the failed-attempt counter resetting on either a successful entry or the cool-down expiring. This default is a starting proposal, not a fixed spec — confirm the exact duration when this gets built.
- **Recovery path:** since there's no account system, "forgot PIN" has to be a manual, physical recovery (e.g. resetting the value directly in the local env/config on that machine) — document this now so it's not a dead end discovered under pressure later.
- Explicitly positioned as **defense in depth alongside 6A**, not a replacement for it — 6A stops the network path, 6B stops the walk-up-to-an-unlocked-screen path.

**Touches:** `package.json` (6A), new `middleware.ts`, a new lock-screen route/component, a small server action to verify the PIN + set the session cookie (6B).

---

## 5. Additional Recommendations — Expert Solution Analyst Perspective

Beyond the six brainstormed items, these stood out during the review as high-value given the domain (ongoing AML monitoring, not just one-time form-filling):

| ID | Recommendation | Why it matters |
|---|---|---|
| **FR-7** | **Periodic review reminder.** PMPJ is a *monitoring* obligation, not a one-time form. Add a `nextReviewDue` date per customer (shorter interval for TINGGI risk, e.g. annual) and a dashboard filter for "overdue for review." | Moves the tool from "fills a form once" to actually supporting the ongoing-monitoring duty the regulation describes — arguably as important as the initial CDD itself. |
| **FR-8** | **Suspicious-transaction (LTKM) flag + export.** Not a full goAML integration (out of scope, see FR-10) — just a "Tandai sebagai LTKM" flag + notes field on a customer, and a filtered view/export of flagged cases to help prepare the manual goAML submission PPATK requires. | Closes the loop between "did the CDD/risk assessment" and "the actual regulatory reporting step," which today the app doesn't touch at all. |
| **FR-9** | **Duplicate-customer detection.** Fuzzy-match on name/`noIdentitas` when creating a new CDD; warn if a likely-existing customer is found. | Repeat clients are normal for a notary; fragmented duplicate records undermine the "monitor the relationship over time" purpose of PMPJ. |
| **FR-10** | **Note on goAML, explicitly out of scope for now.** Full integration with PPATK's goAML platform is a real future direction but a substantial undertaking — flagged here so it's a deliberate future phase, not forgotten. | Scope hygiene — keeps FR-8 honest about what it is and isn't. |
| **FR-11** | **Auto-archive PDF on completion.** The moment a case flips to `COMPLETE`, auto-generate and save the existing PDF export into a dedicated archive folder (and let it ride along on the FR-1 backup), instead of relying on the notary remembering to export manually. | Small change, closes a "forgot to export" gap in the physical-archive requirement the app already exists to serve. |
| **FR-12** | **Indonesian ID format validation.** Lightweight format checks for NIK (16 digits) and NPWP on both manual entry and OCR-guessed values, before they're presented as a "guess" or accepted as final. | Cheap, catches a class of error at the source rather than downstream; also usefully filters out obviously-wrong OCR guesses before they even reach FR-3's review UI. |
| **FR-13** | **Lightweight activity log (not an audit-trail system).** A simple append-only local log — "Customer X created/edited at [timestamp]" — without user attribution (there's only one user) but with a timeline. | Cheap insurance for reconstructing "what happened when" if a record looks wrong later; complements FR-6's shared PIN, since actions are at least timestamped even without being attributed to a specific person. |
| **FR-14** | **Name this as a v1-scope boundary, not a silent assumption.** If the office ever adds a second notary/staff member or a second PC, today's design (local SQLite, no accounts, shared PIN) will need real revisiting. Not a task — just worth stating explicitly as a boundary condition of this phase's decisions, so it's a conscious tradeoff rather than something that quietly breaks later. | Good PRD hygiene — makes today's "single user" decision traceable as a decision, not an oversight, if circumstances change. |

---

## 6. Prioritization Summary

| ID | Feature | Priority | Rough effort | Blocked? |
|---|---|---|---|---|
| FR-6A | Network binding fix (`-H 127.0.0.1`) | Must | XS | No — do first |
| FR-1 | Multi-tier backup (button, HDD, Sheets, Drive) | Must | M | No |
| FR-2A | Business Sector Score — data entry only | Must | XS (once data sourced) | **Blocked** on source data |
| FR-6B | PIN gate + lockout | Must | S | No — confirm defaults |
| FR-5 | Retention & encryption baseline | Must | S–M | Confirm exact duration w/ counsel |
| FR-2B | Corporate/LA EDD form | Must | M (once fields sourced) | **Blocked** on source data |
| FR-3 (Must items) | Field-state styling + review gate | Should→Must | S–M | No |
| FR-4 | Completion checklist | Should | S | No |
| FR-3 (Should items) | Confidence flagging, image snippet | Should | M | No |
| FR-7 | Periodic review reminder | Should | S | No |
| FR-11 | Auto-archive PDF on completion | Should | XS | No |
| FR-12 | ID format validation | Should | S | No |
| FR-8 | LTKM flag + export | Could | S | No |
| FR-9 | Duplicate detection | Could | S | No |
| FR-13 | Activity log | Could | XS | No |
| FR-10 | goAML integration | Future phase | L | Deliberately deferred |

---

## 7. Open Questions — resolve before implementation

- [ ] **FR-2A:** Where does the official Business Sector category/score list come from — PPATK guidance, the notary's own risk policy, or another source? Who supplies it?
- [ ] **FR-2B:** Same question for the Korporasi/Legal Arrangement EDD field list — is there a physical paper form for this Dewi already uses that can be transcribed?
- [ ] **FR-1:** Which Google account(s) should own the Sheets export and the Drive backup folder — a dedicated account, or an existing one? What's the external HDD's expected drive letter/mount path?
- [ ] **FR-5:** Confirm the actual retention period (this doc used 5 years as a commonly-cited figure, not a verified primary-source number) and whether the raw ID photo needs the same retention as the structured record, with your compliance/legal reference.
- [ ] **FR-6B:** Confirm the proposed defaults — 8–12 hour session length, 5-minute lockout after 3 failed PIN attempts — or specify different values.

---

## 8. Non-Functional Principles (apply across all FRs)

1. **Never block the notary's core workflow.** Every new integration (backup, Sheets, Drive, encryption) must fail gracefully and log, exactly like the existing OCR and Sheets-config code already does — this is a established, good pattern in the codebase and new features should match it, not regress it.
2. **Local-first, offline-tolerant.** The app's core value (filling a CDD, computing a risk score) must keep working with no internet connection; cloud-dependent features (1.3, 1.4) are additive, never required for the primary workflow.
3. **No feature in this phase introduces multi-user concepts** (accounts, roles, per-user attribution) — consistent with the explicit non-goal in Section 3.

---

## Appendix A — Existing File Reference Map

| Area | Files |
|---|---|
| Backup / data flow | `lib/googleSheets/client.ts`, `lib/actions/sheetsExport.ts`, `lib/actions/document.ts`, `lib/storage.ts` |
| Known gaps | `lib/refTableConfig.ts`, `app/admin/referensi/page.tsx`, `components/admin/AdminRefTable.tsx`, `prisma/schema.prisma`, `lib/status.ts`, `lib/actions/highRiskInfo.ts` |
| OCR / prefill | `lib/ocr/runOcr.ts`, `lib/ocr/extractFields.ts`, `lib/ocr/applyFieldGuesses.ts`, `components/forms/OcrAssistBanner.tsx`, `components/forms/IndividualForm.tsx`, `CorporateForm.tsx`, `LegalArrangementForm.tsx` |
| Completion checklist | `lib/status.ts`, `app/cdd/[id]/page.tsx`, `app/page.tsx` |
| Retention / security | `lib/storage.ts`, `app/api/documents/[id]/route.ts` |
| Access control | `package.json`, (new) `middleware.ts` |

## Appendix B — Sources Consulted for FR-5

- Ikatan Notaris Indonesia (INI) — commentary on PP No. 43/2015 & Permenkumham No. 9/2017, on CDD document retention duration.
- Secondary legal commentary on Undang-Undang No. 27 Tahun 2022 (UU Pelindungan Data Pribadi), specifically obligations under Pasal 39 ayat (1) on technical/organizational security measures and breach-notification timing.

*These are secondary/commentary sources, not the primary regulation text — verify against the primary source or legal counsel before finalizing any policy built on them.*