import { AIProcessingService } from "@/lib/ai/services/ai-processing";
import type { AiCallOptions } from "@/lib/ai/provider";

/**
 * AI-generated risk category *suggestion* — explicitly NOT the deterministic,
 * regulation-mandated scoring engine (lib/status.ts / lib/actions/
 * riskAssessment.ts), and not wired into it. Any future caller must treat
 * this as a human-reviewed hint only, same principle as OCR field guesses.
 */
export function suggestRiskCategory(cddContext: string, opts?: AiCallOptions) {
  return AIProcessingService.generateRiskAssessment(cddContext, opts);
}
