# Graph Report - notary_aml  (2026-08-11)

## Corpus Check
- 363 files · ~186,910 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2579 nodes · 4536 edges · 167 communities (156 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df37c4ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- duplicateLookup.ts
- retensi/page.tsx
- cdd/[id]/page.tsx
- prisma.ts
- validations.ts
- document.ts
- sheetsExport.ts
- devDependencies
- dependencies
- compilerOptions
- lib/auth.ts
- HighRiskAdditionalInfoForm.tsx
- refData.ts
- cases/[id]/page.tsx
- Data Referensi — Notary CDD & Risk Assessment WebApp
- skeleton.tsx
- config.ts
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- Panduan Deployment Intranet — AML Notarist
- Prisma 7 Driver Adapter Implementation Guide
- Model Queries
- Driver Adapters
- HddBackupConfigPanel.tsx
- Upgrade to Prisma ORM 7
- Relation Queries
- Removed Features
- PRD — Notary CDD & Risk Assessment WebApp: Phase 2 Improvements
- extractFields.ts
- Raw Queries
- Prisma CLI Reference
- Client Methods
- Filter Conditions and Operators
- Query Options
- prisma db push
- prisma dev
- prisma generate
- prisma studio
- Prisma Client API Reference
- Troubleshooting Prisma Compute
- Prisma Config
- prisma migrate dev
- prisma db seed
- Quick Rules
- Environment Variables
- app/page.tsx
- prisma db pull
- prisma init
- prisma migrate deploy
- Prisma Database Setup
- Prisma Accelerate Users
- ESM and CommonJS Support
- Constructor Options
- Schema Changes
- ltkm-export/route.ts
- Transactions
- Workflow
- Prisma Compute Framework Readiness
- MongoDB Setup
- Core Workflows
- prisma db execute
- Prisma Platform CLI App Deploy
- MySQL Setup
- management-api
- ScanUploadPanel.tsx
- compliance.ts
- prisma migrate diff
- prisma migrate reset
- PostgreSQL Setup
- Prisma Postgres Setup
- SQLite Setup
- ================================================================
- SQL Server Setup
- create-db-cli
- api-basics
- app/layout.tsx
- prisma format
- prisma migrate resolve
- prisma validate
- CockroachDB Setup
- decision-stay-or-migrate
- console-and-connections
- IndividualForm.tsx
- prisma migrate status
- Prisma Compute Config
- create-prisma Compute Flow
- migrations-mapping
- schema-contract-mapping
- Prisma MongoDB Upgrade Path
- management-api-sdk
- endpoints
- CLAUDE.md — Notary CDD & Risk Assessment WebApp
- prisma mcp
- client-api-mapping
- Service Tokens
- ollama-provider.ts
- Setup — Konfigurasi Lokal
- prisma debug
- SDK and API Automation
- Prisma Client Setup
- verify-cutover-checklist
- Prisma 7 Client Instantiation
- DashboardUtilityDial.tsx
- ai-processing.ts
- KnowledgeBasePanel.tsx
- README.md
- Strix Cloud API (managed, no local infra)
- AGENTS.md
- AiCallOptions
- useToast
- pinLockBranding.ts
- ecosystem.config.js
- RiskAssessmentForm.tsx
- backup/page.tsx
- reset/page.tsx
- aml_notarist — Phase 2 Remediation: Claude Code Implementation Brief
- scripts
- actions/auth.ts
- driveBackup.ts
- Google Workspace Security Runbook — Notary CDD & Risk Assessment WebApp
- Prisma Compute
- isValidSessionToken
- strix-pentest/SKILL.md
- DashboardCard.tsx
- package.json
- provider-factory.ts
- logSecurityEvent
- strix-ci-setup/SKILL.md
- customerTypeLabels
- cases/page.tsx
- tesseract.js
- provider.ts
- OllamaModelManager.tsx
- secretGuard.ts
- page-header.tsx
- imageDimensions.ts
- Strix scan scope — notary_aml
- Fix Strix findings and verify
- RiskByTypeChart.tsx
- SECURITY.md — Notary CDD & Risk Assessment WebApp
- PinLockBrandingAdmin.tsx
- toast.tsx
- sheetsFullSync.ts
- lucide-react
- 18. KeePassXC — Prosedur Operasional (Penyimpanan Kunci)
- 2. Arsitektur Enkripsi
- PIN Akses (FR-6B)
- 12. Respons Insiden
- greetingForTime
- better-sqlite3
- googleConfig.test.ts
- securityLog.test.ts
- recharts
- guard-not-production.test.ts

## God Nodes (most connected - your core abstractions)
1. `prisma` - 57 edges
2. `AiCallOptions` - 25 edges
3. `logActivity()` - 23 edges
4. `AIProcessingService` - 22 edges
5. `logSecurityEvent()` - 22 edges
6. `Troubleshooting Prisma Compute` - 20 edges
7. `Google Workspace Security Runbook — Notary CDD & Risk Assessment WebApp` - 20 edges
8. `formatDate()` - 19 edges
9. `PageHeader()` - 19 edges
10. `useToast()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `getAiSettings()`  [EXTRACTED]
  app/api/ai/ollama/pull/route.ts → lib/ai/config.ts
- `AppearanceSettingsPage()` --calls--> `getPinLockBrandingSettings()`  [EXTRACTED]
  app/admin/appearance/page.tsx → lib/actions/pinLockBranding.ts
- `AdminLtkmPage()` --calls--> `formatDate()`  [EXTRACTED]
  app/admin/ltkm/page.tsx → components/detail/DetailPrimitives.tsx
- `AdminRetensiPage()` --calls--> `formatDate()`  [EXTRACTED]
  app/admin/retensi/page.tsx → components/detail/DetailPrimitives.tsx
- `GET()` --references--> `AIProcessingService`  [EXTRACTED]
  app/api/ai/status/route.ts → lib/ai/services/ai-processing.ts

## Import Cycles
- None detected.

## Communities (167 total, 11 thin omitted)

### Community 0 - "duplicateLookup.ts"
Cohesion: 0.11
Nodes (32): EditCddPage(), metadata, NewCorporateCddPage(), metadata, NewIndividualCddPage(), CorporateForm(), IndividualForm(), LegalArrangementForm() (+24 more)

### Community 1 - "retensi/page.tsx"
Cohesion: 0.21
Nodes (13): AdminRetensiPage(), metadata, CddDetailPage(), yesNo(), getActivityLog(), addYearsClamped(), getRetentionReviewDate(), isPastRetentionReviewDate() (+5 more)

### Community 2 - "cdd/[id]/page.tsx"
Cohesion: 0.11
Nodes (26): RISK_TONE, CompletionChecklist(), Row, LtkmPanel(), MarkReviewedButton(), CddDocument(), CustomerWithRelations, fmtDate() (+18 more)

### Community 3 - "prisma.ts"
Cohesion: 0.07
Nodes (49): advanceCaseAfterEdd(), createCorporateCustomer(), createIndividualCustomer(), createLegalArrangementCustomer(), updateCorporateCustomer(), updateIndividualCustomer(), updateLegalArrangementCustomer(), nullToClear() (+41 more)

### Community 4 - "validations.ts"
Cohesion: 0.06
Nodes (32): boolToYesNo(), RiskAssessmentPage(), RiskAssessmentForm(), beneficialOwnerSchema, corporateDetailSchema, HighRiskAdditionalInfoOutput, hubunganHukumPengurusValues, individualDetailSchema (+24 more)

### Community 5 - "document.ts"
Cohesion: 0.06
Nodes (59): BackupPanel(), BackupPanelMeta, formatDateTime(), createBackup(), buildFixtureBackup(), NOTE: this does NOT diff DB_PATH's raw bytes before/after — other test, TEST_PNG, verifyLastBackup() (+51 more)

### Community 6 - "sheetsExport.ts"
Cohesion: 0.15
Nodes (24): ExportToSheetButton(), exportCustomerToSheet(), ExportResult, HEADERS, LAST_COLUMN, rewriteTab(), syncAllDetailTabsToSheet(), appendRange() (+16 more)

### Community 7 - "devDependencies"
Cohesion: 0.07
Nodes (29): dotenv, eslint, eslint-config-next, devDependencies, dotenv, eslint, eslint-config-next, pm2 (+21 more)

### Community 8 - "dependencies"
Cohesion: 0.07
Nodes (27): archiver, framer-motion, google-auth-library, @hookform/resolvers, next, dependencies, archiver, framer-motion (+19 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "lib/auth.ts"
Cohesion: 0.15
Nodes (21): GET(), GET(), createOAuthState(), createPinResetToken(), getSessionSecret(), isValidOAuthState(), isValidSignedExpiring(), LOCKOUT_DURATION_MINUTES (+13 more)

### Community 11 - "HighRiskAdditionalInfoForm.tsx"
Cohesion: 0.22
Nodes (8): metadata, HighRiskAdditionalInfoForm(), jenisHighRiskCustomerOptions, jenisIdentitasOptions, penghasilanOptions, sumberKekayaanOptions, tujuanTransaksiOptions, HighRiskAdditionalInfoValues

### Community 12 - "refData.ts"
Cohesion: 0.20
Nodes (15): metadata, AdminRefTable(), RefRow, TABLE_ICON, addRefScoreRow(), getDelegate(), isValidTableKey(), parseCategoryAndScore() (+7 more)

### Community 13 - "cases/[id]/page.tsx"
Cohesion: 0.17
Nodes (15): AdminLtkmPage(), metadata, CaseDetailPage(), generateMetadata(), RISK_TONE, ActivityLogSection(), formatDateTime(), DetailItem() (+7 more)

### Community 14 - "Data Referensi — Notary CDD & Risk Assessment WebApp"
Cohesion: 0.06
Nodes (30): 1. CDD Korporasi, 2. CDD Perorangan, 3. CDD Perikatan Lainnya (Legal Arrangement), 4. Risk Assessment — Analisa PEP (Politically Exposed Person), 5. Risk Assessment — Tabel Referensi Skor, 6. Formula Skoring & Kategori Risiko, 7. Informasi Tambahan — Pengguna Jasa Berisiko Tinggi (Enhanced Due Diligence), 8. Model Data yang Disarankan (ringkas — untuk konteks Step 2 build) (+22 more)

### Community 15 - "skeleton.tsx"
Cohesion: 0.36
Nodes (3): Skeleton(), SkeletonCard(), SkeletonTable()

### Community 18 - "config.ts"
Cohesion: 0.30
Nodes (12): AiProviderRuntimeSettings, defaultSettings(), getAiSettings(), getAiSettingsPublic(), mergeSettings(), resolveCloudApiKey(), StoredAiSettings, updateAiSettings() (+4 more)

### Community 20 - "next.config.ts"
Cohesion: 0.50
Nodes (3): CONTENT_SECURITY_POLICY, nextConfig, PERMISSIONS_POLICY

### Community 22 - "Panduan Deployment Intranet — AML Notarist"
Cohesion: 0.07
Nodes (29): A. Mengatur IP LAN Statis di Server, B. Mengatur DNS Internal, C.1 Unduh Caddy, C.2 Salin Caddyfile, C. Mengatur Reverse Proxy (Caddy), D.1 Install mkcert di server, D.2 Buat sertifikat untuk hostname aplikasi, D. Mengatur Sertifikat TLS Internal (mkcert) (+21 more)

### Community 24 - "Prisma 7 Driver Adapter Implementation Guide"
Cohesion: 0.07
Nodes (29): Architecture Overview, Argument Mapping (input), Checklist, Column Type Inference, ColumnTypeEnum values, Conversion Helpers, Database-Specific Notes, E2E Tests (with PrismaClient) (+21 more)

### Community 25 - "Model Queries"
Cohesion: 0.07
Nodes (27): aggregate, Aggregation Operations, Atomic operations, count, create, Create Operations, createMany, createManyAndReturn (+19 more)

### Community 26 - "Driver Adapters"
Cohesion: 0.07
Nodes (27): Accept self-signed certificates, After (v7), Available Adapters, Before (v6), Configuration, Connection Pool Configuration, Driver Adapters, Installation (+19 more)

### Community 27 - "HddBackupConfigPanel.tsx"
Cohesion: 0.15
Nodes (19): formatBytes(), formatDateTime(), HddBackupConfigPanel(), clearHddBackupTarget(), detectExternalDrivesAction(), setHddBackupTarget(), SetHddBackupTargetResult, detectMock (+11 more)

### Community 28 - "Upgrade to Prisma ORM 7"
Cohesion: 0.08
Nodes (25): 1. Update package.json for ESM-first projects, 2. Update tsconfig.json, 3. Update schema.prisma, 4. Create prisma.config.ts, 5. Install a driver adapter (SQL providers only), 6. Update client instantiation, 7. Replace Prisma.validator with satisfies, 8. Run migrations and generate (+17 more)

### Community 29 - "Relation Queries"
Cohesion: 0.08
Nodes (23): Connect existing, Count Relations, Create or connect, Create with relations, Delete related, Disconnect, every, Filter counted relations (+15 more)

### Community 30 - "Removed Features"
Cohesion: 0.08
Nodes (23): Alternatives, Auto-generate after migrate, Auto-seed after migrate, Automatic Behaviors Removed, CLI Flags Removed, Client Middleware, Common Middleware Patterns, Custom counter with extensions (+15 more)

### Community 31 - "PRD — Notary CDD & Risk Assessment WebApp: Phase 2 Improvements"
Cohesion: 0.08
Nodes (23): 1. Background, 2. Goals, 2A. Business Sector Score Table (Tabel B), 2B. EDD Form for Korporasi / Legal Arrangement, 3. Non-Goals (explicit scope exclusions), 4. Requirements, 5. Additional Recommendations — Expert Solution Analyst Perspective, 6. Prioritization Summary (+15 more)

### Community 32 - "extractFields.ts"
Cohesion: 0.11
Nodes (25): OcrCroppedSnippet(), CORPORATE_LABEL_MAP, escapeRegExp(), extractFieldGuesses(), FieldGuess, INDIVIDUAL_LABEL_MAP, INLINE_CHECKBOX_STOPWORDS, LABEL_MAPS (+17 more)

### Community 33 - "Raw Queries"
Cohesion: 0.09
Nodes (21): BigInt handling, Database-Specific Features, Date handling, Delete example, Dynamic table/column names, $executeRaw, Handling Results, Insert example (+13 more)

### Community 34 - "Prisma CLI Reference"
Cohesion: 0.10
Nodes (20): Boundary: Compute, Bun Runtime, Client Generation, Command Categories, Current Command Behavior, Current Prisma CLI Setup, Database Operations, Environment Variables (+12 more)

### Community 35 - "Client Methods"
Cohesion: 0.10
Nodes (18): Add custom methods, Add model methods, Chain extensions, Client Methods, $connect(), $disconnect(), $extends(), Graceful shutdown (+10 more)

### Community 36 - "Filter Conditions and Operators"
Cohesion: 0.10
Nodes (20): AND (explicit), AND (implicit), Array Field Filters, Combined, Comparison, Equality, every, Filter Conditions and Operators (+12 more)

### Community 37 - "Query Options"
Cohesion: 0.10
Nodes (20): cursor, distinct, Filtered include, include, Include relation count, Multiple distinct fields, Negative take (reverse), Nested include (+12 more)

### Community 38 - "prisma db push"
Cohesion: 0.10
Nodes (19): Accept data loss, Basic push, Command, Common Patterns, Comparison with migrate dev, Examples, Follow-up Command, Force reset (+11 more)

### Community 39 - "prisma dev"
Cohesion: 0.10
Nodes (19): Background mode, Command, Configuration, Custom ports, Examples, Force remove (stops first), Instance Management, List all instances (+11 more)

### Community 40 - "prisma generate"
Cohesion: 0.10
Nodes (19): After schema changes, Basic generation, Bun Runtime, CI/CD pipeline, Command, Common Patterns, Compiler Build Tuning, Current Generator Behavior (+11 more)

### Community 41 - "prisma studio"
Cohesion: 0.10
Nodes (19): Command, Common Workflow, Custom port, Don't open browser, Edit Records, Examples, Features, Filter Data (+11 more)

### Community 42 - "Prisma Client API Reference"
Cohesion: 0.10
Nodes (19): Client Instantiation, Client Methods, Create records, Delete records, Filter Operators, Find records, How to Use, Model Query Methods (+11 more)

### Community 43 - "Troubleshooting Prisma Compute"
Cohesion: 0.10
Nodes (20): Accidental Prisma Postgres Provisioning, Auth Fails, Bun Entrypoint Missing, Compute Config Invalid, `create-prisma --yes` Did Not Deploy, Database Wiring or Schema Did Not Apply, Env Changes Did Not Apply, First Checks (+12 more)

### Community 44 - "Prisma Config"
Cohesion: 0.10
Nodes (19): After (v7) - prisma.config.ts, Basic Configuration, Before (v6) - schema.prisma, Configuration Options, Custom Config Path, datasource.directUrl, datasource.shadowDatabaseUrl, datasource.url (+11 more)

### Community 45 - "prisma migrate dev"
Cohesion: 0.11
Nodes (18): After schema changes, Command, Common Patterns, Create and apply migration, Create without applying, Examples, Follow-up Commands, Full workflow (+10 more)

### Community 46 - "prisma db seed"
Cohesion: 0.11
Nodes (17): Best Practices, Command, Common Patterns, Common seed commands, Conditional seeding, Configuration, Current Workflow, Development reset (+9 more)

### Community 47 - "Quick Rules"
Cohesion: 0.22
Nodes (9): 1. Command Verification, 2. Auth and Workspace Selection, 3. Framework Readiness, 4. Runtime Host and Port Binding, 5. Typed Compute Config, 6. Branch, Environment, and Database, 7. Deploy Operations, 8. SDK and API (+1 more)

### Community 48 - "Environment Variables"
Cohesion: 0.11
Nodes (17): 1. Install dotenv, 2. Import in prisma.config.ts, Application Code, Bun Users, CI/CD Considerations, Entry point, Environment Variables, Multiple .env Files (+9 more)

### Community 49 - "app/page.tsx"
Cohesion: 0.14
Nodes (23): DashboardPage(), firstOrUndefined(), missingSectionsLabel(), RISK_TONE, riskCategoryOptions, statusOptions, typeOptions, ActivityFeedItem (+15 more)

### Community 50 - "prisma db pull"
Cohesion: 0.12
Nodes (16): Basic introspection, Command, Examples, Force overwrite, Generated Schema Example, MongoDB Introspection, Options, Post-Introspection Cleanup (+8 more)

### Community 51 - "prisma init"
Cohesion: 0.12
Nodes (16): Add an example model, Basic initialization, Bun Runtime, Command, Examples, Generated Config (Bun), Generated Config (Node.js default), Generated Schema (+8 more)

### Community 52 - "prisma migrate deploy"
Cohesion: 0.12
Nodes (16): Basic deployment, Best Practices, Check status first, Command, Comparison with migrate dev, Configuration, Docker deployment, Error Handling (+8 more)

### Community 53 - "Prisma Database Setup"
Cohesion: 0.12
Nodes (16): Bun Runtime, Configuration Files, Driver Adapters, How to Use, MongoDB, MySQL, PostgreSQL, Prisma Client Setup (Required) (+8 more)

### Community 54 - "Prisma Accelerate Users"
Cohesion: 0.12
Nodes (16): 1. Keep your Accelerate URL, 2. Install Accelerate extension, 3. Configure prisma.config.ts, 4. Instantiate client with accelerateUrl, Caching with Accelerate, Correct v7 Setup for Accelerate, Edge Runtime, Important (+8 more)

### Community 55 - "ESM and CommonJS Support"
Cohesion: 0.12
Nodes (16): Browser-Safe Types, Bun, "Cannot use import statement outside a module", CommonJS Projects, "ERR_REQUIRE_ESM", ESM and CommonJS Support, ESM Projects, File Extensions (+8 more)

### Community 56 - "Constructor Options"
Cohesion: 0.12
Nodes (15): accelerateUrl (For Accelerate users), adapter (Required for the SQL provider workflow), Basic Instantiation, comments, Constructor Options, errorFormat, log, Log Events (+7 more)

### Community 57 - "Schema Changes"
Cohesion: 0.12
Nodes (15): 1. Provider name, 2. Output is required, 3. engineType changed, 4. moduleFormat is explicit when needed, After Schema Changes, Datasource Block, Example Output Paths, Generated Entrypoints (+7 more)

### Community 58 - "ltkm-export/route.ts"
Cohesion: 0.33
Nodes (7): GET(), RFC-4180, buildLtkmCsv(), csvField(), FORMULA_TRIGGER_CHARS, LTKM_CSV_HEADER, LtkmExportRow

### Community 60 - "Transactions"
Cohesion: 0.13
Nodes (14): All or nothing, Best Practices, Handle errors, Interactive Transactions, Isolation levels, Keep transactions short, Nested Writes, OrThrow in Transactions (+6 more)

### Community 61 - "Workflow"
Cohesion: 0.13
Nodes (14): Error Handling, Prerequisites, Prisma Postgres Setup, Reference Files, Step 1: Authenticate, Step 2: List available regions, Step 3: Create a project with a database, Step 4: Create a named connection (optional) (+6 more)

### Community 62 - "Prisma Compute Framework Readiness"
Cohesion: 0.14
Nodes (14): Astro, Bun, Elysia, and Plain Source Servers, CLI-First Model, CLI Matrix, Custom Build Artifacts, Hono, NestJS, Next.js (+6 more)

### Community 63 - "MongoDB Setup"
Cohesion: 0.14
Nodes (13): 1. Schema Configuration, 2. Environment Variable, Common Issues, Current Verification Notes, Driver Adapters, ID Field Requirement, "Invalid ObjectID", Migrations vs Introspection (+5 more)

### Community 64 - "Core Workflows"
Cohesion: 0.14
Nodes (13): 1. Console-first workflow, 2. Quick provisioning with create-db, 2b. Persistent databases with the Platform CLI, 3. Link an existing local project, 4. Programmatic provisioning with Management API, 5. Type-safe integration with Management API SDK, Core Workflows, How to Use (+5 more)

### Community 65 - "prisma db execute"
Cohesion: 0.15
Nodes (12): Command, Configuration, Current Option Surface, Examples, Execute from file, Execute from stdin, Execute `migrate diff` output, Limitations (+4 more)

### Community 66 - "Prisma Platform CLI App Deploy"
Cohesion: 0.15
Nodes (13): Agent Skill Installation, Auth and Project Binding, Build and Run Locally, Database and Env, Deploy, Deployment Story: GitHub vs CLI, Operations, Output Handling (+5 more)

### Community 67 - "MySQL Setup"
Cohesion: 0.15
Nodes (12): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, Common Issues, Connection String Format, Driver Adapter, JSON Support, MySQL Setup (+4 more)

### Community 68 - "management-api"
Cohesion: 0.15
Nodes (12): API exploration, Authentication methods, Base URL, Common endpoints, management-api, Notes, OAuth flow summary, Priority (+4 more)

### Community 69 - "ScanUploadPanel.tsx"
Cohesion: 0.18
Nodes (12): FileCard(), FileCardProps, UploadPreviewModal(), UploadPreviewProps, UploadProgress(), STATE_META, UploadState, UploadStatusBadge() (+4 more)

### Community 70 - "compliance.ts"
Cohesion: 0.12
Nodes (29): AiFindingRow, CaseAiPanel(), CONFIDENCE_TONE, DuplicateCheckRow, KIND_META, dismissAiFinding(), askComplianceQuestionAction(), checkMissingDocumentsAction() (+21 more)

### Community 71 - "prisma migrate diff"
Cohesion: 0.17
Nodes (11): Check for drift (CI), Command, Create baseline migration, Examples, Generate SQL for a schema change, Options, prisma migrate diff, Review pending migrations (+3 more)

### Community 72 - "prisma migrate reset"
Cohesion: 0.17
Nodes (11): Basic reset, Command, Configuration, Examples, Follow-up Steps, Force reset (CI/Automation), Options, prisma migrate reset (+3 more)

### Community 73 - "PostgreSQL Setup"
Cohesion: 0.17
Nodes (11): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, "Authentication failed", "Can't reach database server", Common Issues, Connection String Format, Driver Adapter (+3 more)

### Community 74 - "Prisma Postgres Setup"
Cohesion: 0.17
Nodes (11): 1. Schema Configuration, 2. Config Configuration, Connection String, Driver Adapter, Edge/serverless option, Features, Overview, Prisma Postgres Setup (+3 more)

### Community 75 - "SQLite Setup"
Cohesion: 0.17
Nodes (11): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, Common Issues, Connection String Format, "Database file not found", Driver Adapter, Limitations (+3 more)

### Community 76 - "================================================================"
Cohesion: 0.18
Nodes (12): ================================================================, ================================================================, ================================================================, ================================================================, ================================================================, ================================================================, ================================================================, ================================================================ (+4 more)

### Community 77 - "SQL Server Setup"
Cohesion: 0.18
Nodes (10): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, Common Issues, Connection String Format, Driver Adapter, "Login failed for user", Prerequisites (+2 more)

### Community 78 - "create-db-cli"
Cohesion: 0.18
Nodes (10): Command discovery (`--help`), Commands, Common patterns, create-db-cli, `create` options, Lifecycle and claim flow, Priority, Programmatic usage (library API) (+2 more)

### Community 79 - "api-basics"
Cohesion: 0.18
Nodes (10): api-basics, Base URL, Collection, Error codes by HTTP status, Error Responses, Pagination, Resource ID Prefixes, Response Envelope (+2 more)

### Community 80 - "app/layout.tsx"
Cohesion: 0.09
Nodes (19): geistMono, inter, metadata, ACTIVITY_EVENTS, IdleLockTimer(), KeyboardShortcuts(), SHORTCUTS, LockButton() (+11 more)

### Community 81 - "prisma format"
Cohesion: 0.20
Nodes (9): Behavior, Command, Examples, Format default schema, Format specific schema, Options, prisma format, Use in Editor (+1 more)

### Community 82 - "prisma migrate resolve"
Cohesion: 0.20
Nodes (9): Command, Examples, Mark as Applied (Baselining), Mark as Rolled Back (Fixing Failures), Options, prisma migrate resolve, References, Use Cases (+1 more)

### Community 83 - "prisma validate"
Cohesion: 0.20
Nodes (9): Command, Common Errors, Examples, Options, prisma validate, Use in CI, Validate default schema, Validate specific schema (+1 more)

### Community 84 - "CockroachDB Setup"
Cohesion: 0.20
Nodes (9): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, CockroachDB Setup, Common Issues, Driver Adapter, ID Generation, Prerequisites (+1 more)

### Community 85 - "decision-stay-or-migrate"
Cohesion: 0.20
Nodes (9): Bad, Blocker checks before migrating, decision-stay-or-migrate, Good, Priority, References, Stay-on-v6 hygiene, The facts the decision rests on (+1 more)

### Community 86 - "console-and-connections"
Cohesion: 0.20
Nodes (9): Adapter choices, Connection setup, console-and-connections, Console workflow, Linking an existing project, Local Studio, Priority, References (+1 more)

### Community 87 - "IndividualForm.tsx"
Cohesion: 0.09
Nodes (42): CorporateFormInner(), defaultValues, hubunganHukumOptions, jenisIdentitasOptions, DraftRecoveryBanner(), formatRelative(), DuplicateFieldBanner(), SectionCard() (+34 more)

### Community 88 - "prisma migrate status"
Cohesion: 0.22
Nodes (8): Check status, Command, Examples, Exit Codes, Options, prisma migrate status, What It Does, When to Use

### Community 89 - "Prisma Compute Config"
Cohesion: 0.22
Nodes (9): App Fields, Basic Shape, Database Scope, File Names and Discovery, Generating a Config with `init`, Monorepos and Multi-App Repos, Precedence, Prisma Compute Config (+1 more)

### Community 90 - "create-prisma Compute Flow"
Cohesion: 0.22
Nodes (9): Addon Notes, Basic Commands, create-prisma Compute Flow, Failure Handling, Generated Deploy Script, Generated Files to Preserve, PostgreSQL and Database Behavior, Reference (+1 more)

### Community 91 - "migrations-mapping"
Cohesion: 0.22
Nodes (8): Bad, Good, migrations-mapping, Priority, Prisma Next: first-class, contract-driven migrations (Mongo included), References, v6: `db push` only, Why It Matters

### Community 92 - "schema-contract-mapping"
Cohesion: 0.22
Nodes (8): Bad, Environment requirements, Good, Priority, References, schema-contract-mapping, The mapping, Why It Matters

### Community 93 - "Prisma MongoDB Upgrade Path"
Cohesion: 0.22
Nodes (8): Decision table, Hand-off rule, If staying on v6: hygiene (a deliberate stay, not neglect), Prisma MongoDB Upgrade Path, Reference files, The decision, up front, The version landscape, Verified against

### Community 94 - "management-api-sdk"
Cohesion: 0.22
Nodes (8): Full SDK (OAuth + refresh), Install, management-api-sdk, OAuth SDK flow, Priority, References, Simple client (existing token), Why It Matters

### Community 95 - "endpoints"
Cohesion: 0.22
Nodes (8): Create connection, Create project (with database), Delete database, Delete project, endpoints, Get database, List projects, List regions

### Community 96 - "CLAUDE.md — Notary CDD & Risk Assessment WebApp"
Cohesion: 0.22
Nodes (8): Asumsi v1, CLAUDE.md — Notary CDD & Risk Assessment WebApp, graphify, Known Gaps (per inisialisasi proyek), Ringkasan Proyek, Riwayat Perubahan, Sumber Kebenaran (Source of Truth), Tech Stack

### Community 97 - "prisma mcp"
Cohesion: 0.25
Nodes (7): Command, Notes, prisma mcp, References, Typical Use Cases, Usage, What It Does

### Community 98 - "client-api-mapping"
Cohesion: 0.25
Nodes (7): Bad, client-api-mapping, Good, Priority, References, The mapping, Why It Matters

### Community 99 - "Service Tokens"
Cohesion: 0.25
Nodes (7): auth, Creating a service token, OAuth 2.0 (for user-scoped access), Security practices, Service Tokens, Token scope, Using a service token

### Community 100 - "ollama-provider.ts"
Cohesion: 0.20
Nodes (11): AiImageInput, ChatMessage, ClassificationResult, DocumentExtractionResult, IdentityExtractionResult, ModelPullProgress, RiskAssessmentSuggestion, asNumber() (+3 more)

### Community 101 - "Setup — Konfigurasi Lokal"
Cohesion: 0.15
Nodes (10): AI Processing Engine (provider-agnostic), Deployment Intranet HTTPS (LAN), Keamanan Data — Enkripsi PII at Rest (subset FR-5, Phase 3), Kunci Enkripsi Terpisah & Migrasi (security hardening pass), Menjalankan App Selalu Aktif (PM2), Perintah (satu baris, sama persis di cmd.exe maupun bash/git-bash), Port & Host Standar, Setup — Konfigurasi Lokal (+2 more)

### Community 102 - "prisma debug"
Cohesion: 0.29
Nodes (6): Command, Example Output, Options, prisma debug, What It Does, When to Use

### Community 104 - "SDK and API Automation"
Cohesion: 0.25
Nodes (7): Compute SDK, Management API Concepts, Prefer the CLI for App Workflows, Regions, SDK and API Automation, SDK Build Strategies, Secrets and Redaction

### Community 105 - "Prisma Client Setup"
Cohesion: 0.29
Nodes (6): 1. Install dependencies, 2. Add generator block, 3. Generate Prisma Client, 4. Instantiate Prisma Client, 5. Use a single instance, Prisma Client Setup

### Community 106 - "verify-cutover-checklist"
Cohesion: 0.29
Nodes (6): Checklist, Ground rules, Priority, References, verify-cutover-checklist, Why It Matters

### Community 107 - "Prisma 7 Client Instantiation"
Cohesion: 0.29
Nodes (6): Basic instantiation, Common mistakes, Key rules, Prisma 7 Client Instantiation, Required packages, Usage in application code

### Community 108 - "DashboardUtilityDial.tsx"
Cohesion: 0.13
Nodes (20): DashboardPendingTaskData, DashboardSystemHealthData, DashboardUtilityDial(), DIAL_ITEMS, PanelKey, PENDING_TASK_ICON, SYSTEM_HEALTH_ICON, SYSTEM_STATUS_META (+12 more)

### Community 109 - "ai-processing.ts"
Cohesion: 0.13
Nodes (16): runDuplicateCheck(), AiUsageSummary, logAiRequest(), AiProviderError, resolveRoute(), AIProcessingService, modelForProvider(), NOTE: this service is intentionally NOT wired into the existing (+8 more)

### Community 110 - "KnowledgeBasePanel.tsx"
Cohesion: 0.19
Nodes (14): KnowledgeBasePage(), metadata, KnowledgeBasePanel(), KnowledgeDocumentRow, SOURCE_LABEL, addKnowledgeDocument(), AddKnowledgeDocumentResult, deleteKnowledgeDocument() (+6 more)

### Community 111 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 112 - "Strix Cloud API (managed, no local infra)"
Cohesion: 0.18
Nodes (10): 1. Register the target as an asset, 2. Launch a scan, 3. Poll to completion, 4. Read findings, 5. Export & report, 6. PR reviews, 7. Continuous testing (schedules & webhooks), Safety (+2 more)

### Community 114 - "AiCallOptions"
Cohesion: 0.33
Nodes (9): AiCallOptions, AiResult, asNumber(), asString(), estimateCostUsd(), extractJsonObject(), GeminiPart, GeminiProvider (+1 more)

### Community 115 - "useToast"
Cohesion: 0.20
Nodes (16): AppearanceSettingsPage(), metadata, GET(), HeroBannerAdmin(), PinLockBrandingAdmin(), useToast(), ALLOWED_MIME, DEFAULT_SETTINGS (+8 more)

### Community 116 - "pinLockBranding.ts"
Cohesion: 0.16
Nodes (16): GET(), LockLayout(), ALLOWED_MIME, DEFAULT_SETTINGS, getPinLockBrandingSettings(), resetPinLockHeroImage(), saveSettings(), buildValidPng() (+8 more)

### Community 117 - "ecosystem.config.js"
Cohesion: 0.50
Nodes (3): OLLAMA_HOME, os, path

### Community 118 - "RiskAssessmentForm.tsx"
Cohesion: 0.08
Nodes (31): BeneficialOwnerArrayField(), BeneficialOwnerRow(), emptyBeneficialOwner, FormWithBeneficialOwners, jenisIdentitasOptions, describedBy(), FullRow(), ocrBorderClass() (+23 more)

### Community 119 - "backup/page.tsx"
Cohesion: 0.19
Nodes (12): AdminBackupPage(), metadata, register(), getLastBackupInfo(), BackupChannelsStatus, getBackupChannelsStatus(), isHddBackupTargetReachable(), getSystemHealth() (+4 more)

### Community 120 - "reset/page.tsx"
Cohesion: 0.14
Nodes (17): ERROR_MESSAGES, ForgotPinPage(), metadata, metadata, ResetPinPage(), generateMetadata(), isSessionExpiredReason(), LockPage() (+9 more)

### Community 121 - "aml_notarist — Phase 2 Remediation: Claude Code Implementation Brief"
Cohesion: 0.14
Nodes (13): After Phase 6, aml_notarist — Phase 2 Remediation: Claude Code Implementation Brief, Context for Claude Code — read before writing any code, How to use this, Non-negotiable constraints — apply to every phase, Phase 1 — Close the active data exposure (FR-6A), Phase 2 — Lightweight access control (FR-6B), Phase 3 — Encrypt PII at rest (subset of FR-5) (+5 more)

### Community 122 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, dev, dev:lan, down, lint, logs, predev (+10 more)

### Community 123 - "actions/auth.ts"
Cohesion: 0.19
Nodes (21): extendSession(), cookieJar, CookieRecord, loggedEvents, redirectCalls, verifyPin(), VerifyPinResult, ResetPinResult (+13 more)

### Community 124 - "driveBackup.ts"
Cohesion: 0.35
Nodes (9): backupDocumentToDrive(), GOOGLE_API_MAX_ATTEMPTS, googleApiBackoffDelayMs(), isRetryableGoogleApiStatus(), RETRYABLE_STATUS, sleep(), DriveConfig, getDriveConfig() (+1 more)

### Community 125 - "Google Workspace Security Runbook — Notary CDD & Risk Assessment WebApp"
Cohesion: 0.11
Nodes (18): 10. Rotasi Kunci Enkripsi Aplikasi, 11. Rotasi Kredensial Google, 13. Revocation (Pencabutan Akses), 14. Offboarding Klien, 15. Retensi Data di Google Drive/Sheets, 16. Review Ekspor Berkala, 17. Checklist Deployment, 19. Penyimpanan Kredensial Google (Direktori Terproteksi & NTFS ACL) (+10 more)

### Community 126 - "Prisma Compute"
Cohesion: 0.22
Nodes (9): Avoid, Decision Tree, Preferred Workflow, Prisma Compute, Prisma Compute CLI Surface, Rules by Priority, Send Feedback and Report CLI Issues, Source-of-Truth Order (+1 more)

### Community 127 - "isValidSessionToken"
Cohesion: 0.21
Nodes (10): GET(), GET(), getSessionExpiryMs(), isValidSessionToken(), SESSION_COOKIE_NAME, assertAuthenticated(), AuthorizationError, authorizeDocumentAccess() (+2 more)

### Community 128 - "strix-pentest/SKILL.md"
Cohesion: 0.18
Nodes (10): Exit codes (headless), Option A — Open-source CLI (self-hosted), Option B — Cloud API (managed, no local infra), Prerequisites, Reading results, Reporting & next steps, Run a Strix pentest, Running a scan (+2 more)

### Community 129 - "DashboardCard.tsx"
Cohesion: 0.33
Nodes (4): DashboardCard(), DashboardCardProps, DashboardCardTrend, TONE_CLASS

### Community 130 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 132 - "provider-factory.ts"
Cohesion: 0.13
Nodes (7): testProviderConnectionAction(), AIProvider, getProvider(), listAvailableProviders(), PROVIDER_REGISTRY, ProviderBuilder, ResolvedRoute

### Community 133 - "logSecurityEvent"
Cohesion: 0.15
Nodes (12): RetentionDeleteButton(), SheetsFullSyncPanel(), TAB_LABELS, ConfirmDialog(), ConfirmDialogProps, deleteCustomerRecord(), DeleteCustomerResult, FullSyncResult (+4 more)

### Community 134 - "strix-ci-setup/SKILL.md"
Cohesion: 0.29
Nodes (6): GitHub Actions, Option A — Self-hosted OSS CLI in the runner, Option B — Managed platform (no runner infra), Optional: upload findings to GitHub code scanning, Other CI systems, Set up Strix in CI/CD

### Community 135 - "customerTypeLabels"
Cohesion: 0.29
Nodes (5): metadata, options, DuplicateLookupPanel(), NEW_CDD_ROUTE, customerTypeLabels

### Community 136 - "cases/page.tsx"
Cohesion: 0.09
Nodes (33): buildHref(), CasesListPage(), firstOrUndefined(), metadata, RISK_TONE, riskCategoryOptions, STATUS_FILTERS, STATUS_LABEL (+25 more)

### Community 138 - "provider.ts"
Cohesion: 0.14
Nodes (23): AiProcessingSettingsPage(), metadata, AiSettingsPanel(), CAPABILITY_LABEL, MODE_OPTIONS, AiStatusWidget(), MODE_LABEL, PROVIDER_LABEL (+15 more)

### Community 139 - "OllamaModelManager.tsx"
Cohesion: 0.21
Nodes (9): POST(), GET(), formatBytes(), OllamaModelManager(), PullProgress, deleteOllamaModelAction(), listOllamaModelsAction(), OllamaModelInfo (+1 more)

### Community 140 - "secretGuard.ts"
Cohesion: 0.24
Nodes (11): ALLOWLIST, EXCLUDE_DIR_NAMES, FORBIDDEN_PATTERNS, PatternRule, SCAN_DIRS, SCAN_ROOT_FILES, scanContentForSecretPatterns(), scanRepository() (+3 more)

### Community 141 - "page-header.tsx"
Cohesion: 0.23
Nodes (9): AdminSecurityLogPage(), EVENT_LABELS, EVENT_TONES, formatTs(), metadata, metadata, NewLegalArrangementCddPage(), PageHeader() (+1 more)

### Community 142 - "imageDimensions.ts"
Cohesion: 0.23
Nodes (5): ImageDimensions, readImageDimensions(), readJpegDimensions(), readPngDimensions(), readWebpDimensions()

### Community 145 - "Strix scan scope — notary_aml"
Cohesion: 0.29
Nodes (6): App model (read before scanning), Explicitly OUT of scope — do not report these, In scope — test for these, they are real given the actual auth model, Output, Scope for this run: SOURCE CODE ONLY (white-box), Strix scan scope — notary_aml

### Community 146 - "Fix Strix findings and verify"
Cohesion: 0.33
Nodes (5): 1. Triage, 2. Fix, 3. Verify by re-running Strix, 4. Report, Fix Strix findings and verify

### Community 147 - "RiskByTypeChart.tsx"
Cohesion: 0.15
Nodes (12): RiskByTypeChart(), RiskByTypePoint, SERIES, RANGE_OPTIONS, RiskChart(), RiskTrendPoint, SERIES, RiskDistribution (+4 more)

### Community 148 - "SECURITY.md — Notary CDD & Risk Assessment WebApp"
Cohesion: 0.18
Nodes (11): 10. Google Workspace — Threat Model, 11. Referensi Silang, 1. Model Ancaman & Asumsi Dasar, 3. Backup & Restore, 4. Otorisasi, 5. Tata Kelola AI (AI Governance), 6. Keamanan Upload, 7. Header Keamanan & Deployment Intranet (+3 more)

### Community 149 - "PinLockBrandingAdmin.tsx"
Cohesion: 0.33
Nodes (5): AuthHeroPanel(), Dropzone(), DropzoneProps, PinLockBrandingSettings, LOGIN_BRANDING

### Community 150 - "toast.tsx"
Cohesion: 0.29
Nodes (7): ToastContext, ToastContextValue, ToastInput, ToastItem, ToastProvider(), ToastVariant, VARIANT_META

### Community 151 - "sheetsFullSync.ts"
Cohesion: 0.29
Nodes (10): categorizeGoogleApiError(), SheetsConfig, ALL_DETAIL_TABS, TAB_ACTIVITY_LOG, TAB_CDD_KORPORASI, TAB_CDD_PERIKATAN_LAINNYA, TAB_CDD_PERORANGAN, TAB_EDD_BERISIKO_TINGGI (+2 more)

### Community 153 - "18. KeePassXC — Prosedur Operasional (Penyimpanan Kunci)"
Cohesion: 0.33
Nodes (6): 18.1 Instalasi, 18.2 Lokasi Vault, 18.3 Isi Vault, 18.4 Master Passphrase, 18.5 Salinan Pemulihan (Recovery Copy), 18. KeePassXC — Prosedur Operasional (Penyimpanan Kunci)

### Community 154 - "2. Arsitektur Enkripsi"
Cohesion: 0.33
Nodes (6): 2.1 Sebelum hardening pass ini (v1, legacy — MASIH didukung untuk baca), 2.2 Setelah hardening pass ini (v2 — dedicated keys), 2.3 Migrasi (v1 -> v2), 2.4 Fail-closed, bukan auto-generate kunci, 2.5 Key lifecycle — pembuatan, penyimpanan, backup, rotasi, 2. Arsitektur Enkripsi

### Community 155 - "PIN Akses (FR-6B)"
Cohesion: 0.33
Nodes (6): Kustomisasi Layar Masuk (Login/PIN Lock), Lupa PIN — reset lewat Google Sign-In, Mengatur PIN pertama kali, Percobaan salah / terkunci, PIN Akses (FR-6B), Reset manual (fallback, tanpa Google)

### Community 156 - "12. Respons Insiden"
Cohesion: 0.40
Nodes (5): 12.1 Kredensial Service Account bocor/dicurigai bocor, 12.2 Google Sheet ter-share publik tidak sengaja, 12.3 Folder Drive ter-share eksternal tidak sengaja, 12.4 Destinasi salah (data klien A masuk ke Sheet/Drive klien B), 12. Respons Insiden

## Knowledge Gaps
- **1278 isolated node(s):** `metadata`, `metadata`, `metadata`, `metadata`, `metadata` (+1273 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `prisma.ts` to `duplicateLookup.ts`, `retensi/page.tsx`, `cdd/[id]/page.tsx`, `validations.ts`, `document.ts`, `logSecurityEvent`, `sheetsExport.ts`, `cases/page.tsx`, `HighRiskAdditionalInfoForm.tsx`, `refData.ts`, `cases/[id]/page.tsx`, `config.ts`, `sheetsFullSync.ts`, `HddBackupConfigPanel.tsx`, `app/page.tsx`, `ltkm-export/route.ts`, `compliance.ts`, `ai-processing.ts`, `KnowledgeBasePanel.tsx`, `useToast`, `pinLockBranding.ts`, `actions/auth.ts`, `driveBackup.ts`, `isValidSessionToken`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `recharts`, `document.ts`, `tesseract.js`, `lucide-react`, `better-sqlite3`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `document.ts` to `dependencies`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _1278 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `duplicateLookup.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10512820512820513 - nodes in this community are weakly interconnected._
- **Should `cdd/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Should `prisma.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07040328092959672 - nodes in this community are weakly interconnected._