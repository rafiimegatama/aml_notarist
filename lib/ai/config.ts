import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/ai/crypto";
import type { AiCapability, AiMode, ProviderId } from "@/lib/ai/provider";

const SETTINGS_KEY = "ai_settings";

export interface AiProviderRuntimeSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

/** Full settings, including the encrypted (never plaintext-at-rest) cloud API key. Server-side only. */
export interface AiSettings {
  mode: AiMode;
  local: AiProviderRuntimeSettings & { baseUrl: string };
  cloud: AiProviderRuntimeSettings & { apiKeyEncrypted: string | null };
  visionEnabled: boolean;
  ocrEnabled: boolean;
  chatEnabled: boolean;
  /** Per-capability provider override, used when mode === "hybrid". */
  hybridRouting: Partial<Record<AiCapability, ProviderId>>;
}

/** Safe-for-client projection — the plaintext/encrypted API key never leaves the server. */
export interface AiSettingsPublic {
  mode: AiMode;
  local: AiProviderRuntimeSettings & { baseUrl: string };
  cloud: AiProviderRuntimeSettings & { hasApiKey: boolean; apiKeyPreview: string | null };
  visionEnabled: boolean;
  ocrEnabled: boolean;
  chatEnabled: boolean;
  hybridRouting: Partial<Record<AiCapability, ProviderId>>;
}

// Bootstrap defaults from env — mirrors lib/pinSettings.ts's pattern (.env is
// the fallback until an admin saves settings via the UI, at which point the
// AppSetting row wins). Model names are NEVER hardcoded elsewhere — this is
// the one place a default is proposed, and it's fully overridable at runtime.
function defaultSettings(): AiSettings {
  return {
    mode: (process.env.AI_MODE as AiMode | undefined) ?? "local",
    local: {
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
      model: process.env.OLLAMA_MODEL ?? "llava",
      temperature: 0.2,
      maxTokens: 1024,
      timeoutMs: 60_000, // model lokal bisa jauh lebih lambat dari cloud, terutama cold start
    },
    cloud: {
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      temperature: 0.2,
      maxTokens: 1024,
      timeoutMs: 30_000,
      apiKeyEncrypted: process.env.GEMINI_API_KEY ? encryptSecret(process.env.GEMINI_API_KEY) : null,
    },
    visionEnabled: true,
    ocrEnabled: true,
    chatEnabled: true,
    // Contoh routing dari spesifikasi: OCR/Chat -> Local, Vision/Risk -> Cloud.
    hybridRouting: {
      extractDocument: "ollama",
      extractIdentity: "ollama",
      classifyDocument: "ollama",
      summarize: "ollama",
      chat: "ollama",
      vision: "gemini",
      generateRiskAssessment: "gemini",
    },
  };
}

type StoredAiSettings = Partial<Omit<AiSettings, "local" | "cloud" | "hybridRouting">> & {
  local?: Partial<AiSettings["local"]>;
  cloud?: Partial<AiSettings["cloud"]>;
  hybridRouting?: Partial<Record<AiCapability, ProviderId>>;
};

/** Merge a possibly-partial stored row over defaults — new fields added later never crash old saved settings. */
function mergeSettings(base: AiSettings, stored: StoredAiSettings): AiSettings {
  return {
    mode: stored.mode ?? base.mode,
    local: { ...base.local, ...stored.local },
    cloud: { ...base.cloud, ...stored.cloud },
    visionEnabled: stored.visionEnabled ?? base.visionEnabled,
    ocrEnabled: stored.ocrEnabled ?? base.ocrEnabled,
    chatEnabled: stored.chatEnabled ?? base.chatEnabled,
    hybridRouting: { ...base.hybridRouting, ...stored.hybridRouting },
  };
}

export async function getAiSettings(): Promise<AiSettings> {
  const defaults = defaultSettings();
  const row = await prisma.appSetting.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row) return defaults;
  try {
    const stored = JSON.parse(row.value) as StoredAiSettings;
    return mergeSettings(defaults, stored);
  } catch {
    return defaults;
  }
}

export async function getAiSettingsPublic(): Promise<AiSettingsPublic> {
  const settings = await getAiSettings();
  const plaintextKey = settings.cloud.apiKeyEncrypted
    ? decryptSecret(settings.cloud.apiKeyEncrypted)
    : null;
  return {
    mode: settings.mode,
    local: settings.local,
    cloud: {
      model: settings.cloud.model,
      temperature: settings.cloud.temperature,
      maxTokens: settings.cloud.maxTokens,
      timeoutMs: settings.cloud.timeoutMs,
      hasApiKey: !!plaintextKey,
      apiKeyPreview: plaintextKey ? maskSecret(plaintextKey) : null,
    },
    visionEnabled: settings.visionEnabled,
    ocrEnabled: settings.ocrEnabled,
    chatEnabled: settings.chatEnabled,
    hybridRouting: settings.hybridRouting,
  };
}

/**
 * `newApiKey` semantics: undefined = leave unchanged, "" (empty string) =
 * clear/remove, non-empty = encrypt and replace. This mirrors the
 * nullifyEmpty gotcha documented in lib/actions/shared.ts/ltkm.ts — we
 * coalesce explicitly rather than letting `undefined` accidentally mean
 * "keep" in the wrong direction.
 */
export async function updateAiSettings(
  patch: Partial<Omit<AiSettings, "local" | "cloud">> & {
    local?: Partial<AiSettings["local"]>;
    cloud?: Partial<Omit<AiSettings["cloud"], "apiKeyEncrypted">>;
    newApiKey?: string;
  }
): Promise<AiSettings> {
  const current = await getAiSettings();
  const { newApiKey, ...rest } = patch;

  const apiKeyEncrypted =
    newApiKey === undefined
      ? current.cloud.apiKeyEncrypted
      : newApiKey === ""
        ? null
        : encryptSecret(newApiKey);

  const next: AiSettings = {
    mode: rest.mode ?? current.mode,
    local: { ...current.local, ...rest.local },
    cloud: { ...current.cloud, ...rest.cloud, apiKeyEncrypted },
    visionEnabled: rest.visionEnabled ?? current.visionEnabled,
    ocrEnabled: rest.ocrEnabled ?? current.ocrEnabled,
    chatEnabled: rest.chatEnabled ?? current.chatEnabled,
    hybridRouting: { ...current.hybridRouting, ...rest.hybridRouting },
  };

  await prisma.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });

  return next;
}

/** Resolves the actual cloud API key for making a real request — server-side only, never sent to the client. */
export function resolveCloudApiKey(settings: AiSettings): string | null {
  if (!settings.cloud.apiKeyEncrypted) return null;
  return decryptSecret(settings.cloud.apiKeyEncrypted);
}
