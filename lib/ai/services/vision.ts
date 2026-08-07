import { AIProcessingService } from "@/lib/ai/services/ai-processing";
import type { AiCallOptions, AiImageInput } from "@/lib/ai/provider";

/** Free-form vision Q&A over an image, provider-agnostic. */
export function describeImage(image: AiImageInput, prompt: string, opts?: AiCallOptions) {
  return AIProcessingService.vision(image, prompt, opts);
}
