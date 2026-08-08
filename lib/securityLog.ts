import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { SECURITY_LOG_PATH } from "@/lib/storage";

// Security event types logged by the application.
export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOCKOUT_TRIGGERED"
  | "LOGOUT"
  | "SESSION_EXTENDED"
  | "PIN_RESET"
  | "BACKUP_CREATED"
  | "CUSTOMER_DELETED";

export type SecurityEvent = {
  ts: string; // ISO timestamp
  type: SecurityEventType;
  detail?: string; // free-text context (never PII)
};

/**
 * Append one security event to storage/security.log (NDJSON — one JSON per
 * line). Never throws — security logging must not fail the calling action.
 * File is created on first write; directory is assumed to exist (storage/
 * is created by other init paths).
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  detail?: string
): Promise<void> {
  try {
    await mkdir(path.dirname(SECURITY_LOG_PATH), { recursive: true });
    const event: SecurityEvent = { ts: new Date().toISOString(), type, ...(detail ? { detail } : {}) };
    await appendFile(SECURITY_LOG_PATH, JSON.stringify(event) + "\n", "utf-8");
  } catch (err) {
    console.error("Security log write failed:", err);
  }
}

const MAX_EVENTS = 500;

/**
 * Read the last MAX_EVENTS security events from the log, most recent first.
 * Returns empty array if the log file does not exist yet.
 */
export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  try {
    const raw = await readFile(SECURITY_LOG_PATH, "utf-8");
    const lines = raw
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .slice(-MAX_EVENTS);
    return lines
      .map((l) => {
        try { return JSON.parse(l) as SecurityEvent; } catch { return null; }
      })
      .filter((e): e is SecurityEvent => e !== null)
      .reverse(); // most recent first
  } catch {
    return [];
  }
}
