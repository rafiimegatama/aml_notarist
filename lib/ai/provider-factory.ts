import { OllamaProvider } from "@/lib/ai/providers/ollama-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { resolveCloudApiKey, type AiSettings } from "@/lib/ai/config";
import type { AiCapability, AIProvider, ProviderId } from "@/lib/ai/provider";

/**
 * Registry of provider builders — the ONLY place that needs a new entry
 * when adding a provider (Claude/OpenAI/Azure OpenAI/OpenRouter/Groq/
 * Mistral/...). Each builder returns null if the provider isn't usable yet
 * (e.g. no API key configured) rather than throwing, so callers can decide
 * whether that's fatal or just means "skip this one for hybrid fallback".
 */
type ProviderBuilder = (settings: AiSettings) => AIProvider | null;

const PROVIDER_REGISTRY: Record<ProviderId, ProviderBuilder> = {
  ollama: (settings) => new OllamaProvider(settings.local.baseUrl, settings.local.model),
  gemini: (settings) => {
    const apiKey = resolveCloudApiKey(settings);
    return apiKey ? new GeminiProvider(apiKey, settings.cloud.model) : null;
  },
};

export function getProvider(id: ProviderId, settings: AiSettings): AIProvider | null {
  return PROVIDER_REGISTRY[id](settings);
}

export function listAvailableProviders(settings: AiSettings): AIProvider[] {
  return (Object.keys(PROVIDER_REGISTRY) as ProviderId[])
    .map((id) => getProvider(id, settings))
    .filter((p): p is AIProvider => p !== null);
}

export interface ResolvedRoute {
  primary: AIProvider;
  fallback: AIProvider | null;
}

/**
 * Resolves which provider(s) handle a given capability under the current
 * mode. This is the single place hybrid routing + local/cloud selection
 * logic lives — AIProcessingService never inspects `settings.mode` itself.
 */
export function resolveRoute(capability: AiCapability, settings: AiSettings): ResolvedRoute {
  if (settings.mode === "local") {
    const primary = getProvider("ollama", settings);
    if (!primary) {
      throw new Error("Mode Lokal aktif tetapi provider Ollama tidak dapat diinisialisasi.");
    }
    return { primary, fallback: null };
  }

  if (settings.mode === "cloud") {
    const primary = getProvider("gemini", settings);
    if (!primary) {
      throw new Error("Mode Cloud aktif tetapi API key provider cloud belum dikonfigurasi.");
    }
    return { primary, fallback: null };
  }

  // Hybrid — per-capability routing (default ollama if unset), with the
  // other configured provider as automatic failover in both directions.
  const primaryId: ProviderId = settings.hybridRouting[capability] ?? "ollama";
  const fallbackId: ProviderId = primaryId === "ollama" ? "gemini" : "ollama";
  const primary = getProvider(primaryId, settings);
  const fallback = getProvider(fallbackId, settings);
  if (!primary && !fallback) {
    throw new Error("Mode Hybrid aktif tetapi tidak ada provider yang terkonfigurasi.");
  }
  // Kalau primary yang diinginkan tidak tersedia (mis. API key belum diisi),
  // fallback langsung jadi primary — tidak perlu menunggu gagal dulu.
  return primary ? { primary, fallback } : { primary: fallback as AIProvider, fallback: null };
}
