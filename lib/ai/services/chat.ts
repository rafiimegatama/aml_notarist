import { AIProcessingService } from "@/lib/ai/services/ai-processing";
import type { AiCallOptions, ChatMessage } from "@/lib/ai/provider";

export function sendChatMessage(messages: ChatMessage[], opts?: AiCallOptions) {
  return AIProcessingService.chat(messages, opts);
}

export function summarizeText(text: string, opts?: AiCallOptions) {
  return AIProcessingService.summarize(text, opts);
}
