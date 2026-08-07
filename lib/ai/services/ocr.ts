import { AIProcessingService } from "@/lib/ai/services/ai-processing";
import type { AiCallOptions, AiImageInput } from "@/lib/ai/provider";

/**
 * AI-provider-based OCR (Ollama vision model or Gemini vision) — separate
 * from and NOT used by the existing Tesseract-based OCR upload flow in
 * lib/ocr/* and lib/actions/document.ts, which stays untouched. This is
 * the entry point for any future feature that wants provider-agnostic
 * document text extraction instead.
 */
export function extractDocumentText(image: AiImageInput, opts?: AiCallOptions) {
  return AIProcessingService.extractDocument(image, opts);
}

export function extractIdentityFields(image: AiImageInput, opts?: AiCallOptions) {
  return AIProcessingService.extractIdentity(image, opts);
}

export function classifyDocumentType(image: AiImageInput, opts?: AiCallOptions) {
  return AIProcessingService.classifyDocument(image, opts);
}
