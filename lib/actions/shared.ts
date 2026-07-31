import type { ZodError } from "zod";

export type ActionResult =
  | { success: true }
  | {
      success: false;
      formError?: string;
      fieldErrors: Record<string, string>;
    };

export function toDate(value?: string) {
  return value ? new Date(value) : undefined;
}

/** "" dari input HTML kosong diperlakukan setara "tidak diisi" (undefined) di level Prisma. */
export function nullifyEmpty<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key in out) {
    if (out[key] === "") out[key] = undefined as never;
  }
  return out;
}

export function flattenZodError(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
