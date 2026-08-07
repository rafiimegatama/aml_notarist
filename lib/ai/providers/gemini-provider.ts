import {
  AiProviderError,
  type AIProvider,
  type AiCallOptions,
  type AiImageInput,
  type AiResult,
  type ChatMessage,
  type ClassificationResult,
  type DocumentExtractionResult,
  type IdentityExtractionResult,
  type ProviderHealth,
  type RiskAssessmentSuggestion,
} from "@/lib/ai/provider";

const DEFAULT_TIMEOUT_MS = 30_000;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Rough estimate only (USD per 1M tokens), shown as a cost hint in the AI
// request log — NOT a substitute for the provider's actual billing. Unknown
// model prefixes simply omit a cost figure rather than guessing wrong.
const PRICE_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
};

function estimateCostUsd(model: string, promptTokens?: number, completionTokens?: number): number | undefined {
  const priceKey = Object.keys(PRICE_PER_1M_TOKENS).find((k) => model.startsWith(k));
  if (!priceKey || promptTokens === undefined || completionTokens === undefined) return undefined;
  const price = PRICE_PER_1M_TOKENS[priceKey];
  return (promptTokens * price.input + completionTokens * price.output) / 1_000_000;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export class GeminiProvider implements AIProvider {
  readonly id = "gemini" as const;
  readonly displayName = "Gemini (Cloud)";

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel: string
  ) {}

  private async generateContent(
    parts: GeminiPart[],
    opts: AiCallOptions | undefined,
    systemInstruction?: string
  ): Promise<{ text: string; latencyMs: number; model: string; promptTokens?: number; completionTokens?: number }> {
    const model = opts?.model ?? this.defaultModel;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
          generationConfig: {
            temperature: opts?.temperature ?? 0.2,
            maxOutputTokens: opts?.maxTokens ?? 1024,
          },
        }),
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new AiProviderError(this.id, `Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      return {
        text,
        latencyMs,
        model,
        promptTokens: json.usageMetadata?.promptTokenCount,
        completionTokens: json.usageMetadata?.candidatesTokenCount,
      };
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      throw new AiProviderError(
        this.id,
        isAbort ? "Permintaan ke Gemini melebihi batas waktu." : "Gagal menghubungi Gemini API.",
        err
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private toResult(r: Awaited<ReturnType<GeminiProvider["generateContent"]>>): AiResult<string> {
    return {
      data: r.text,
      providerId: this.id,
      model: r.model,
      latencyMs: r.latencyMs,
      usage: {
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        estimatedCostUsd: estimateCostUsd(r.model, r.promptTokens, r.completionTokens),
      },
    };
  }

  async isHealthy(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE}/models/${this.defaultModel}?key=${this.apiKey}`, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      const latencyMs = Date.now() - start;
      if (!res.ok) return { providerId: this.id, healthy: false, latencyMs, message: `HTTP ${res.status}` };
      return { providerId: this.id, healthy: true, latencyMs };
    } catch (err) {
      return {
        providerId: this.id,
        healthy: false,
        latencyMs: null,
        message: err instanceof Error ? err.message : "Tidak dapat dijangkau",
      };
    }
  }

  async chat(messages: ChatMessage[], opts?: AiCallOptions): Promise<AiResult<string>> {
    const systemInstruction = messages.find((m) => m.role === "system")?.content;
    const conversational = messages.filter((m) => m.role !== "system");
    // Gemini's multi-turn "contents" array expects role user/model alternating;
    // for our simple use (single-shot capability calls) we fold history into one user turn.
    const combined = conversational.map((m) => `${m.role === "assistant" ? "Asisten" : "Pengguna"}: ${m.content}`).join("\n\n");
    const r = await this.generateContent([{ text: combined }], opts, systemInstruction);
    return this.toResult(r);
  }

  async vision(image: AiImageInput, prompt: string, opts?: AiCallOptions): Promise<AiResult<string>> {
    const r = await this.generateContent(
      [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }],
      opts
    );
    return this.toResult(r);
  }

  async summarize(text: string, opts?: AiCallOptions): Promise<AiResult<string>> {
    const r = await this.generateContent(
      [{ text }],
      opts,
      "Ringkas teks berikut secara singkat dan jelas dalam Bahasa Indonesia."
    );
    return this.toResult(r);
  }

  async extractDocument(image: AiImageInput, opts?: AiCallOptions): Promise<AiResult<DocumentExtractionResult>> {
    const prompt =
      "Baca seluruh teks pada gambar dokumen ini apa adanya. Balas HANYA dengan JSON valid berbentuk " +
      '{"rawText": string, "fields": object berisi pasangan label-nilai yang berhasil dikenali, "confidence": angka 0-100 perkiraan keyakinanmu}.';
    const r = await this.generateContent(
      [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }],
      opts
    );
    const parsed = extractJsonObject(r.text);
    const data: DocumentExtractionResult = {
      rawText: asString(parsed?.rawText) ?? r.text,
      fields: (parsed?.fields as Record<string, string>) ?? {},
      confidence: asNumber(parsed?.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs, usage: this.toResult(r).usage };
  }

  async extractIdentity(image: AiImageInput, opts?: AiCallOptions): Promise<AiResult<IdentityExtractionResult>> {
    const prompt =
      "Ini foto/scan dokumen identitas Indonesia (KTP/Paspor/SIM). Balas HANYA dengan JSON valid: " +
      '{"fullName": string|null, "idNumber": string|null, "dateOfBirth": string|null, "address": string|null, "documentType": string|null, "confidence": angka 0-100}.';
    const r = await this.generateContent(
      [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }],
      opts
    );
    const parsed = extractJsonObject(r.text) ?? {};
    const data: IdentityExtractionResult = {
      fullName: asString(parsed.fullName),
      idNumber: asString(parsed.idNumber),
      dateOfBirth: asString(parsed.dateOfBirth),
      address: asString(parsed.address),
      documentType: asString(parsed.documentType),
      confidence: asNumber(parsed.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs, usage: this.toResult(r).usage };
  }

  async classifyDocument(image: AiImageInput, opts?: AiCallOptions): Promise<AiResult<ClassificationResult>> {
    const prompt =
      "Klasifikasikan jenis dokumen pada gambar ini (mis. KTP, Paspor, SIM, NPWP, Akta, Lainnya). Balas HANYA JSON: " +
      '{"label": string, "confidence": angka 0-100}.';
    const r = await this.generateContent(
      [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }],
      opts
    );
    const parsed = extractJsonObject(r.text) ?? {};
    const data: ClassificationResult = {
      label: asString(parsed.label) ?? "Tidak diketahui",
      confidence: asNumber(parsed.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs, usage: this.toResult(r).usage };
  }

  async generateRiskAssessment(context: string, opts?: AiCallOptions): Promise<AiResult<RiskAssessmentSuggestion>> {
    const prompt =
      "Berdasarkan konteks CDD berikut, sarankan kategori risiko AML (RENDAH/SEDANG/TINGGI) beserta alasan singkat. " +
      'Ini HANYA saran, wajib ditinjau manusia. Balas HANYA JSON: {"category": "RENDAH"|"SEDANG"|"TINGGI", "rationale": string, "confidence": angka 0-100}.\n\n' +
      context;
    const r = await this.generateContent([{ text: prompt }], opts);
    const parsed = extractJsonObject(r.text) ?? {};
    const category = asString(parsed.category);
    const data: RiskAssessmentSuggestion = {
      category: category === "RENDAH" || category === "SEDANG" || category === "TINGGI" ? category : "SEDANG",
      rationale: asString(parsed.rationale) ?? r.text,
      confidence: asNumber(parsed.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs, usage: this.toResult(r).usage };
  }
}
