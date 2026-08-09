"use server";

import { revalidatePath } from "next/cache";
import { getAiSettings, getAiSettingsPublic, updateAiSettings, type AiSettingsPublic } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/provider-factory";
import { OllamaProvider } from "@/lib/ai/providers/ollama-provider";
import type { AiCapability, AiMode, OllamaModelInfo, ProviderHealth, ProviderId } from "@/lib/ai/provider";
import { toSafeErrorMessage } from "@/lib/safeError";

const SETTINGS_PATH = "/admin/ai-processing";

export async function getAiSettingsAction(): Promise<AiSettingsPublic> {
  return getAiSettingsPublic();
}

export type UpdateAiSettingsResult = { success: true } | { success: false; error: string };

export async function updateAiSettingsAction(input: {
  mode?: AiMode;
  local?: { baseUrl?: string; model?: string; temperature?: number; maxTokens?: number; timeoutMs?: number };
  cloud?: { model?: string; temperature?: number; maxTokens?: number; timeoutMs?: number };
  newApiKey?: string;
  visionEnabled?: boolean;
  ocrEnabled?: boolean;
  chatEnabled?: boolean;
  hybridRouting?: Partial<Record<AiCapability, ProviderId>>;
}): Promise<UpdateAiSettingsResult> {
  try {
    await updateAiSettings(input);
    revalidatePath(SETTINGS_PATH);
    return { success: true };
  } catch (err) {
    console.error("Simpan pengaturan AI gagal:", err);
    return { success: false, error: toSafeErrorMessage(err, "Gagal menyimpan pengaturan AI.") };
  }
}

export async function testProviderConnectionAction(providerId: ProviderId): Promise<ProviderHealth> {
  const settings = await getAiSettings();
  const provider = getProvider(providerId, settings);
  if (!provider) {
    return {
      providerId,
      healthy: false,
      latencyMs: null,
      message: providerId === "gemini" ? "API key belum dikonfigurasi." : "Provider tidak dapat diinisialisasi.",
    };
  }
  return provider.isHealthy();
}

export type ListOllamaModelsResult =
  | { success: true; models: OllamaModelInfo[] }
  | { success: false; error: string };

export async function listOllamaModelsAction(): Promise<ListOllamaModelsResult> {
  try {
    const settings = await getAiSettings();
    const provider = new OllamaProvider(settings.local.baseUrl, settings.local.model);
    const models = await provider.listModels();
    return { success: true, models };
  } catch (err) {
    console.error("Muat daftar model Ollama gagal:", err);
    return { success: false, error: toSafeErrorMessage(err, "Gagal memuat daftar model Ollama.") };
  }
}

export type DeleteOllamaModelResult = { success: true } | { success: false; error: string };

export async function deleteOllamaModelAction(model: string): Promise<DeleteOllamaModelResult> {
  try {
    const settings = await getAiSettings();
    const provider = new OllamaProvider(settings.local.baseUrl, settings.local.model);
    await provider.deleteModel(model);
    revalidatePath(SETTINGS_PATH);
    return { success: true };
  } catch (err) {
    console.error("Hapus model Ollama gagal:", err);
    return { success: false, error: toSafeErrorMessage(err, "Gagal menghapus model.") };
  }
}

export async function setDefaultLocalModelAction(model: string): Promise<UpdateAiSettingsResult> {
  return updateAiSettingsAction({ local: { model } });
}
