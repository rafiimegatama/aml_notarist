// Tests must not depend on a real .env being present (CI has none) — both
// lib/auth.ts and lib/documentEncryption.ts require SESSION_SECRET, so a
// deterministic test-only fallback is set once here, never overriding a
// real value if one happens to already be set (e.g. running tests locally
// with .env loaded).
process.env.SESSION_SECRET ??= "test-session-secret-not-a-real-key";
