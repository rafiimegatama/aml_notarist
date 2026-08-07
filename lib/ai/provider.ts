/**
 * The provider-agnostic AI contract. Every provider (Ollama, Gemini, and any
 * future addition — Claude/OpenAI/Azure/OpenRouter/Groq/Mistral/...)
 * implements exactly this interface and normalizes its own response shape
 * into the types below. Business logic and UI code must NEVER import a
 * concrete provider directly — only `lib/ai/services/ai-processing.ts`
 * (via `AIProcessingService`) talks to `AIProvider` instances, resolved
 * through `lib/ai/provider-factory.ts`.
 *
 * Adding a new provider = one new file in `lib/ai/providers/` implementing
 * this interface + one line in the factory's provider registry. No other
 * file in the app needs to change.
 */

export type ProviderId = "ollama" | "gemini";

export const PROVIDER_IDS: ProviderId[] = ["ollama", "gemini"];

export type AiCapability =
  | "extractDocument"
  | "extractIdentity"
  | "classifyDocument"
  | "summarize"
  | "chat"
  | "vision"
  | "generateRiskAssessment";

export const AI_CAPABILITIES: AiCapability[] = [
  "extractDocument",
  "extractIdentity",
  "classifyDocument",
  "summarize",
  "chat",
  "vision",
  "generateRiskAssessment",
];

export type AiMode = "local" | "cloud" | "hybrid";

export interface AiImageInput {
  /** base64-encoded image bytes, no `data:` prefix */
  base64: string;
  mimeType: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCallOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Override the configured default model for this one call only. */
  model?: string;
}

export interface AiUsage {
  promptTokens?: number;
  completionTokens?: number;
  /** Always undefined for local providers — no per-token cost. */
  estimatedCostUsd?: number;
}

/** Every provider method returns this envelope — never a provider-specific shape. */
export interface AiResult<T> {
  data: T;
  providerId: ProviderId;
  model: string;
  latencyMs: number;
  usage?: AiUsage;
}

export interface DocumentExtractionResult {
  rawText: string;
  fields: Record<string, string>;
  /** 0-100 overall confidence; null if the provider doesn't report one. */
  confidence: number | null;
}

export interface IdentityExtractionResult {
  fullName: string | null;
  idNumber: string | null;
  dateOfBirth: string | null;
  address: string | null;
  documentType: string | null;
  confidence: number | null;
}

export interface ClassificationResult {
  label: string;
  confidence: number | null;
  alternatives?: { label: string; confidence: number | null }[];
}

/**
 * NOTE — this is an AI-assisted *suggestion*, entirely separate from the
 * deterministic, regulation-mandated scoring in lib/status.ts /
 * lib/actions/riskAssessment.ts. It is not wired into that flow and must
 * never silently feed a compliance record — any future use of this must
 * stay a human-reviewed suggestion, same principle as the existing OCR
 * three-state review gate.
 */
export interface RiskAssessmentSuggestion {
  category: "RENDAH" | "SEDANG" | "TINGGI";
  rationale: string;
  confidence: number | null;
}

export interface ProviderHealth {
  providerId: ProviderId;
  healthy: boolean;
  latencyMs: number | null;
  message?: string;
}

export interface OllamaModelInfo {
  name: string;
  sizeBytes: number | null;
  parameterSize: string | null;
  quantization: string | null;
  modifiedAt: string | null;
}

export interface ModelPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface AIProvider {
  readonly id: ProviderId;
  readonly displayName: string;

  isHealthy(): Promise<ProviderHealth>;

  extractDocument(
    image: AiImageInput,
    opts?: AiCallOptions
  ): Promise<AiResult<DocumentExtractionResult>>;

  extractIdentity(
    image: AiImageInput,
    opts?: AiCallOptions
  ): Promise<AiResult<IdentityExtractionResult>>;

  classifyDocument(
    image: AiImageInput,
    opts?: AiCallOptions
  ): Promise<AiResult<ClassificationResult>>;

  summarize(text: string, opts?: AiCallOptions): Promise<AiResult<string>>;

  chat(messages: ChatMessage[], opts?: AiCallOptions): Promise<AiResult<string>>;

  vision(
    image: AiImageInput,
    prompt: string,
    opts?: AiCallOptions
  ): Promise<AiResult<string>>;

  generateRiskAssessment(
    context: string,
    opts?: AiCallOptions
  ): Promise<AiResult<RiskAssessmentSuggestion>>;
}

/** Thrown by providers/services on failure — always caught by AIProcessingService. */
export class AiProviderError extends Error {
  constructor(
    public readonly providerId: ProviderId,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
