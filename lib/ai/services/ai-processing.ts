import { getAiSettings, type AiSettings } from "@/lib/ai/config";
import { listAvailableProviders, resolveRoute } from "@/lib/ai/provider-factory";
import { logAiRequest } from "@/lib/ai/logging";
import {
  AiProviderError,
  type AIProvider,
  type AiCallOptions,
  type AiCapability,
  type AiImageInput,
  type AiMode,
  type AiResult,
  type ChatMessage,
  type ClassificationResult,
  type DocumentExtractionResult,
  type IdentityExtractionResult,
  type ProviderHealth,
  type ProviderId,
  type RiskAssessmentSuggestion,
} from "@/lib/ai/provider";

function modelForProvider(providerId: ProviderId, settings: AiSettings): string {
  return providerId === "ollama" ? settings.local.model : settings.cloud.model;
}

function assertEnabled(enabled: boolean, label: string): void {
  if (!enabled) {
    throw new Error(`Kapabilitas AI "${label}" sedang dinonaktifkan di Pengaturan AI Processing.`);
  }
}

async function runWithFailover<T>(
  capability: AiCapability,
  settings: AiSettings,
  call: (provider: AIProvider) => Promise<AiResult<T>>
): Promise<AiResult<T>> {
  const { primary, fallback } = resolveRoute(capability, settings);

  try {
    const start = Date.now();
    const result = await call(primary);
    void logAiRequest({
      capability,
      providerId: result.providerId,
      model: result.model,
      success: true,
      latencyMs: result.latencyMs || Date.now() - start,
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      estimatedCostUsd: result.usage?.estimatedCostUsd,
    });
    return result;
  } catch (primaryErr) {
    const primaryMessage = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    void logAiRequest({
      capability,
      providerId: primary.id,
      model: modelForProvider(primary.id, settings),
      success: false,
      latencyMs: 0,
      errorMessage: primaryMessage,
    });

    if (!fallback) {
      throw primaryErr;
    }

    try {
      const start = Date.now();
      const result = await call(fallback);
      void logAiRequest({
        capability,
        providerId: result.providerId,
        model: result.model,
        success: true,
        latencyMs: result.latencyMs || Date.now() - start,
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
        estimatedCostUsd: result.usage?.estimatedCostUsd,
      });
      return result;
    } catch (fallbackErr) {
      const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      void logAiRequest({
        capability,
        providerId: fallback.id,
        model: modelForProvider(fallback.id, settings),
        success: false,
        latencyMs: 0,
        errorMessage: fallbackMessage,
      });
      throw new AiProviderError(
        fallback.id,
        `Provider utama (${primary.id}: ${primaryMessage}) dan cadangan (${fallback.id}: ${fallbackMessage}) sama-sama gagal.`,
        fallbackErr
      );
    }
  }
}

/**
 * The single entry point business logic (and any future feature) should
 * call for AI capabilities. It never exposes which provider handled the
 * request — callers get back a normalized AiResult<T> regardless of
 * whether Ollama or Gemini (or a future provider) actually served it.
 *
 * NOTE: this service is intentionally NOT wired into the existing
 * Tesseract-based OCR upload flow (lib/actions/document.ts) or the
 * deterministic Risk Assessment scoring (lib/actions/riskAssessment.ts) —
 * see lib/ai/provider.ts's note on RiskAssessmentSuggestion. It's a
 * separate, additive capability layer available for future features.
 */
export const AIProcessingService = {
  async extractDocument(
    image: AiImageInput,
    opts?: AiCallOptions
  ): Promise<AiResult<DocumentExtractionResult>> {
    const settings = await getAiSettings();
    assertEnabled(settings.ocrEnabled, "OCR");
    return runWithFailover("extractDocument", settings, (p) => p.extractDocument(image, opts));
  },

  async extractIdentity(
    image: AiImageInput,
    opts?: AiCallOptions
  ): Promise<AiResult<IdentityExtractionResult>> {
    const settings = await getAiSettings();
    assertEnabled(settings.ocrEnabled, "OCR");
    return runWithFailover("extractIdentity", settings, (p) => p.extractIdentity(image, opts));
  },

  async classifyDocument(
    image: AiImageInput,
    opts?: AiCallOptions
  ): Promise<AiResult<ClassificationResult>> {
    const settings = await getAiSettings();
    assertEnabled(settings.ocrEnabled, "OCR");
    return runWithFailover("classifyDocument", settings, (p) => p.classifyDocument(image, opts));
  },

  async summarize(text: string, opts?: AiCallOptions): Promise<AiResult<string>> {
    const settings = await getAiSettings();
    return runWithFailover("summarize", settings, (p) => p.summarize(text, opts));
  },

  async chat(messages: ChatMessage[], opts?: AiCallOptions): Promise<AiResult<string>> {
    const settings = await getAiSettings();
    assertEnabled(settings.chatEnabled, "Chat");
    return runWithFailover("chat", settings, (p) => p.chat(messages, opts));
  },

  async vision(image: AiImageInput, prompt: string, opts?: AiCallOptions): Promise<AiResult<string>> {
    const settings = await getAiSettings();
    assertEnabled(settings.visionEnabled, "Vision");
    return runWithFailover("vision", settings, (p) => p.vision(image, prompt, opts));
  },

  async generateRiskAssessment(
    context: string,
    opts?: AiCallOptions
  ): Promise<AiResult<RiskAssessmentSuggestion>> {
    const settings = await getAiSettings();
    return runWithFailover("generateRiskAssessment", settings, (p) => p.generateRiskAssessment(context, opts));
  },

  /** Used by the AI Processing settings page and the dashboard status widget. */
  async getHealthSnapshot(): Promise<{ mode: AiMode; providers: ProviderHealth[] }> {
    const settings = await getAiSettings();
    const providers = listAvailableProviders(settings);
    const results = await Promise.all(providers.map((p) => p.isHealthy()));
    return { mode: settings.mode, providers: results };
  },
};
