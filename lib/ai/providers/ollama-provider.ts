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
  type ModelPullProgress,
  type OllamaModelInfo,
  type ProviderHealth,
  type RiskAssessmentSuggestion,
} from "@/lib/ai/provider";

const DEFAULT_TIMEOUT_MS = 60_000;

/** Finds the first balanced `{...}` substring — models often wrap JSON in prose or markdown fences despite instructions. */
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

export class OllamaProvider implements AIProvider {
  readonly id = "ollama" as const;
  readonly displayName = "Ollama (Local)";

  constructor(
    private readonly baseUrl: string,
    private readonly defaultModel: string
  ) {}

  private async request(
    path: string,
    body: unknown,
    opts?: AiCallOptions,
    method: "POST" | "GET" | "DELETE" = "POST"
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "GET" ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new AiProviderError(this.id, `Ollama HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      return res;
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      throw new AiProviderError(this.id, "Gagal menghubungi Ollama — pastikan `ollama serve` berjalan.", err);
    } finally {
      clearTimeout(timeout);
    }
  }

  async isHealthy(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal }).finally(() =>
        clearTimeout(timeout)
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) return { providerId: this.id, healthy: false, latencyMs, message: `HTTP ${res.status}` };
      return { providerId: this.id, healthy: true, latencyMs };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        providerId: this.id,
        healthy: false,
        latencyMs: null,
        message: isAbort ? "Waktu tunggu habis" : "Tidak dapat dijangkau — pastikan `ollama serve` berjalan",
      };
    }
  }

  private async chatRaw(
    messages: ChatMessage[],
    opts: AiCallOptions | undefined,
    images?: string[]
  ): Promise<{ content: string; latencyMs: number; model: string; promptTokens?: number; completionTokens?: number }> {
    const model = opts?.model ?? this.defaultModel;
    const start = Date.now();
    const ollamaMessages = messages.map((m, i) =>
      images && i === messages.length - 1 ? { role: m.role, content: m.content, images } : { role: m.role, content: m.content }
    );
    const res = await this.request(
      "/api/chat",
      {
        model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: opts?.temperature ?? 0.2,
          num_predict: opts?.maxTokens ?? 1024,
        },
      },
      opts
    );
    const json = (await res.json()) as {
      message?: { content?: string };
      eval_count?: number;
      prompt_eval_count?: number;
    };
    return {
      content: json.message?.content ?? "",
      latencyMs: Date.now() - start,
      model,
      promptTokens: json.prompt_eval_count,
      completionTokens: json.eval_count,
    };
  }

  async chat(messages: ChatMessage[], opts?: AiCallOptions): Promise<AiResult<string>> {
    const r = await this.chatRaw(messages, opts);
    return {
      data: r.content,
      providerId: this.id,
      model: r.model,
      latencyMs: r.latencyMs,
      usage: { promptTokens: r.promptTokens, completionTokens: r.completionTokens },
    };
  }

  async vision(image: AiImageInput, prompt: string, opts?: AiCallOptions): Promise<AiResult<string>> {
    const r = await this.chatRaw([{ role: "user", content: prompt }], opts, [image.base64]);
    return {
      data: r.content,
      providerId: this.id,
      model: r.model,
      latencyMs: r.latencyMs,
      usage: { promptTokens: r.promptTokens, completionTokens: r.completionTokens },
    };
  }

  async summarize(text: string, opts?: AiCallOptions): Promise<AiResult<string>> {
    const r = await this.chatRaw(
      [
        { role: "system", content: "Ringkas teks berikut secara singkat dan jelas dalam Bahasa Indonesia." },
        { role: "user", content: text },
      ],
      opts
    );
    return {
      data: r.content,
      providerId: this.id,
      model: r.model,
      latencyMs: r.latencyMs,
      usage: { promptTokens: r.promptTokens, completionTokens: r.completionTokens },
    };
  }

  async extractDocument(image: AiImageInput, opts?: AiCallOptions): Promise<AiResult<DocumentExtractionResult>> {
    const prompt =
      "Baca seluruh teks pada gambar dokumen ini apa adanya. Balas HANYA dengan JSON valid berbentuk " +
      '{"rawText": string, "fields": object berisi pasangan label-nilai yang berhasil dikenali, "confidence": angka 0-100 perkiraan keyakinanmu}.';
    const r = await this.chatRaw([{ role: "user", content: prompt }], opts, [image.base64]);
    const parsed = extractJsonObject(r.content);
    const data: DocumentExtractionResult = {
      rawText: asString(parsed?.rawText) ?? r.content,
      fields: (parsed?.fields as Record<string, string>) ?? {},
      confidence: asNumber(parsed?.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs };
  }

  async extractIdentity(image: AiImageInput, opts?: AiCallOptions): Promise<AiResult<IdentityExtractionResult>> {
    const prompt =
      "Ini foto/scan dokumen identitas Indonesia (KTP/Paspor/SIM). Balas HANYA dengan JSON valid: " +
      '{"fullName": string|null, "idNumber": string|null, "dateOfBirth": string|null, "address": string|null, "documentType": string|null, "confidence": angka 0-100}.';
    const r = await this.chatRaw([{ role: "user", content: prompt }], opts, [image.base64]);
    const parsed = extractJsonObject(r.content) ?? {};
    const data: IdentityExtractionResult = {
      fullName: asString(parsed.fullName),
      idNumber: asString(parsed.idNumber),
      dateOfBirth: asString(parsed.dateOfBirth),
      address: asString(parsed.address),
      documentType: asString(parsed.documentType),
      confidence: asNumber(parsed.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs };
  }

  async classifyDocument(image: AiImageInput, opts?: AiCallOptions): Promise<AiResult<ClassificationResult>> {
    const prompt =
      "Klasifikasikan jenis dokumen pada gambar ini (mis. KTP, Paspor, SIM, NPWP, Akta, Lainnya). Balas HANYA JSON: " +
      '{"label": string, "confidence": angka 0-100}.';
    const r = await this.chatRaw([{ role: "user", content: prompt }], opts, [image.base64]);
    const parsed = extractJsonObject(r.content) ?? {};
    const data: ClassificationResult = {
      label: asString(parsed.label) ?? "Tidak diketahui",
      confidence: asNumber(parsed.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs };
  }

  async generateRiskAssessment(context: string, opts?: AiCallOptions): Promise<AiResult<RiskAssessmentSuggestion>> {
    const prompt =
      "Berdasarkan konteks CDD berikut, sarankan kategori risiko AML (RENDAH/SEDANG/TINGGI) beserta alasan singkat. " +
      'Ini HANYA saran, wajib ditinjau manusia. Balas HANYA JSON: {"category": "RENDAH"|"SEDANG"|"TINGGI", "rationale": string, "confidence": angka 0-100}.\n\n' +
      context;
    const r = await this.chatRaw([{ role: "user", content: prompt }], opts);
    const parsed = extractJsonObject(r.content) ?? {};
    const category = asString(parsed.category);
    const data: RiskAssessmentSuggestion = {
      category: category === "RENDAH" || category === "SEDANG" || category === "TINGGI" ? category : "SEDANG",
      rationale: asString(parsed.rationale) ?? r.content,
      confidence: asNumber(parsed.confidence),
    };
    return { data, providerId: this.id, model: r.model, latencyMs: r.latencyMs };
  }

  // ------------------------------------------------------------------
  // Ollama-specific model management — not part of the generic AIProvider
  // contract (Gemini has no local models to list/pull/delete), used
  // directly by the admin Settings UI.
  // ------------------------------------------------------------------

  async listModels(): Promise<OllamaModelInfo[]> {
    const res = await this.request("/api/tags", undefined, undefined, "GET");
    const json = (await res.json()) as {
      models?: {
        name: string;
        size?: number;
        modified_at?: string;
        details?: { parameter_size?: string; quantization_level?: string };
      }[];
    };
    return (json.models ?? []).map((m) => ({
      name: m.name,
      sizeBytes: m.size ?? null,
      parameterSize: m.details?.parameter_size ?? null,
      quantization: m.details?.quantization_level ?? null,
      modifiedAt: m.modified_at ?? null,
    }));
  }

  async deleteModel(model: string): Promise<void> {
    await this.request("/api/delete", { model }, undefined, "DELETE");
  }

  /** Streams pull progress as it arrives from Ollama's NDJSON response — consumed by the pull route handler. */
  async *pullModel(model: string): AsyncGenerator<ModelPullProgress> {
    const controller = new AbortController();
    const res = await fetch(`${this.baseUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: true }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      throw new AiProviderError(this.id, `Gagal memulai pull model "${model}" (HTTP ${res.status}).`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            yield JSON.parse(line) as ModelPullProgress;
          } catch {
            // baris NDJSON tidak lengkap/rusak — lewati, jangan gagalkan seluruh stream
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
