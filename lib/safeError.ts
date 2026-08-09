/**
 * Sanitizes an error message before it is sent to the client (AI provider
 * connectivity errors, admin-triggered diagnostics). These are diagnostic
 * strings shown to the same authenticated office operator who triggered the
 * action (e.g. "cannot reach Ollama"), so they are useful to keep — but raw
 * Node error messages can incidentally embed absolute filesystem paths
 * (common in ENOENT/EACCES errors), which should never reach the browser.
 * Always console.error the original error server-side separately; this
 * function is for the client-facing string only.
 */
export function toSafeErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error) || !err.message) return fallback;
  const sanitized = err.message
    .replace(/[A-Za-z]:\\[^\s"')]+/g, "[path]") // Windows absolute paths
    .replace(/\/(?:home|Users|mnt|var|etc|root)\/[^\s"')]+/g, "[path]") // POSIX absolute paths
    .slice(0, 300);
  return sanitized || fallback;
}
