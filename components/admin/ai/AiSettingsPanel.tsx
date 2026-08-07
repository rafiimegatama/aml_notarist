"use client";

import { useState, useTransition } from "react";
import {
  Camera,
  Cloud,
  KeyRound,
  MessageSquare,
  Save,
  Server,
  Sliders,
  Split,
} from "lucide-react";
import { updateAiSettingsAction } from "@/lib/actions/aiSettings";
import type { AiSettingsPublic } from "@/lib/ai/config";
import type { AiCapability, AiMode, ProviderId } from "@/lib/ai/provider";
import { AI_CAPABILITIES } from "@/lib/ai/provider";

const MODE_OPTIONS: { value: AiMode; label: string; description: string }[] = [
  { value: "local", label: "LOCAL", description: "Semua kapabilitas lewat Ollama di mesin ini." },
  { value: "hybrid", label: "HYBRID", description: "Rute per-kapabilitas, otomatis failover." },
  { value: "cloud", label: "CLOUD", description: "Semua kapabilitas lewat Gemini API." },
];

const CAPABILITY_LABEL: Record<AiCapability, string> = {
  extractDocument: "Ekstraksi Dokumen (OCR)",
  extractIdentity: "Ekstraksi Identitas",
  classifyDocument: "Klasifikasi Dokumen",
  summarize: "Ringkas Teks",
  chat: "Chat",
  vision: "Vision (Analisis Gambar)",
  generateRiskAssessment: "Saran Risk Assessment",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
const labelClass = "block text-xs font-semibold text-muted";

export function AiSettingsPanel({ initial }: { initial: AiSettingsPublic }) {
  const [settings, setSettings] = useState(initial);
  const [newApiKey, setNewApiKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  function save() {
    setSaveState("idle");
    startTransition(async () => {
      const result = await updateAiSettingsAction({
        mode: settings.mode,
        local: settings.local,
        cloud: {
          model: settings.cloud.model,
          temperature: settings.cloud.temperature,
          maxTokens: settings.cloud.maxTokens,
          timeoutMs: settings.cloud.timeoutMs,
        },
        newApiKey: newApiKey || undefined,
        visionEnabled: settings.visionEnabled,
        ocrEnabled: settings.ocrEnabled,
        chatEnabled: settings.chatEnabled,
        hybridRouting: settings.hybridRouting,
      });
      if (result.success) {
        setSaveState("saved");
        setNewApiKey("");
      } else {
        setSaveState("error");
        setSaveError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Mode switch */}
      <div className="card p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <Split className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Mode AI</h2>
            <p className="mt-1 text-sm font-medium text-muted">
              Menentukan provider mana yang menangani setiap kapabilitas AI.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-1 rounded-2xl bg-slate-100 p-1 sm:grid-cols-3">
          {MODE_OPTIONS.map((opt) => {
            const active = settings.mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, mode: opt.value }))}
                className={`rounded-xl px-4 py-3 text-left transition-all ${
                  active ? "bg-white shadow-soft-md" : "hover:bg-white/60"
                }`}
              >
                <span className={`block text-sm font-bold tracking-wide ${active ? "text-brand-hover" : "text-slate-600"}`}>
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs font-medium text-muted">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Capability toggles */}
      <div className="card p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <Sliders className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Kapabilitas</h2>
            <p className="mt-1 text-sm font-medium text-muted">Aktifkan/nonaktifkan kapabilitas AI secara global.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { key: "ocrEnabled" as const, label: "OCR Enabled", icon: Camera },
            { key: "visionEnabled" as const, label: "Vision Enabled", icon: Camera },
            { key: "chatEnabled" as const, label: "Chat Enabled", icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Icon className="h-4 w-4 text-muted" strokeWidth={2} />
                {label}
              </span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                className="h-4 w-4 accent-brand"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Local provider */}
      {(settings.mode === "local" || settings.mode === "hybrid") && (
        <div className="card p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
              <Server className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Provider Lokal — Ollama</h2>
              <p className="mt-1 text-sm font-medium text-muted">Model diunduh &amp; dijalankan di mesin ini.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Base URL</label>
              <input
                type="text"
                value={settings.local.baseUrl}
                onChange={(e) => setSettings((s) => ({ ...s, local: { ...s.local, baseUrl: e.target.value } }))}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <input
                type="text"
                list="local-model-suggestions"
                value={settings.local.model}
                onChange={(e) => setSettings((s) => ({ ...s, local: { ...s.local, model: e.target.value } }))}
                placeholder="mis. qwen2.5vl, llava, gemma3, mistral, phi4"
                className={`mt-1.5 ${inputClass}`}
              />
              <datalist id="local-model-suggestions">
                <option value="llava" />
                <option value="qwen2.5vl" />
                <option value="gemma3" />
                <option value="mistral" />
                <option value="phi4" />
              </datalist>
            </div>
            <div>
              <label className={labelClass}>Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={settings.local.temperature}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, local: { ...s.local, temperature: Number(e.target.value) } }))
                }
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Max Tokens</label>
              <input
                type="number"
                min="1"
                value={settings.local.maxTokens}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, local: { ...s.local, maxTokens: Number(e.target.value) } }))
                }
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={settings.local.timeoutMs}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, local: { ...s.local, timeoutMs: Number(e.target.value) } }))
                }
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cloud provider */}
      {(settings.mode === "cloud" || settings.mode === "hybrid") && (
        <div className="card p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
              <Cloud className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Provider Cloud — Gemini</h2>
              <p className="mt-1 text-sm font-medium text-muted">API key disimpan terenkripsi, tidak pernah ditampilkan utuh.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
                  API Key
                </span>
              </label>
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder={
                  settings.cloud.hasApiKey ? `Terkonfigurasi (${settings.cloud.apiKeyPreview}) — isi untuk mengganti` : "Tempel API key Gemini"
                }
                className={`mt-1.5 ${inputClass}`}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <input
                type="text"
                list="cloud-model-suggestions"
                value={settings.cloud.model}
                onChange={(e) => setSettings((s) => ({ ...s, cloud: { ...s.cloud, model: e.target.value } }))}
                className={`mt-1.5 ${inputClass}`}
              />
              <datalist id="cloud-model-suggestions">
                <option value="gemini-2.5-flash" />
                <option value="gemini-2.5-pro" />
                <option value="gemini-1.5-flash" />
              </datalist>
            </div>
            <div>
              <label className={labelClass}>Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={settings.cloud.temperature}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cloud: { ...s.cloud, temperature: Number(e.target.value) } }))
                }
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Max Tokens</label>
              <input
                type="number"
                min="1"
                value={settings.cloud.maxTokens}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cloud: { ...s.cloud, maxTokens: Number(e.target.value) } }))
                }
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={settings.cloud.timeoutMs}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cloud: { ...s.cloud, timeoutMs: Number(e.target.value) } }))
                }
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hybrid routing */}
      {settings.mode === "hybrid" && (
        <div className="card p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
              <Split className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Rute Hybrid per-Kapabilitas</h2>
              <p className="mt-1 text-sm font-medium text-muted">
                Provider yang tidak dipilih otomatis jadi failover kalau provider utama gagal/offline.
              </p>
            </div>
          </div>
          <div className="mt-5 divide-y divide-border-subtle rounded-2xl border border-border-subtle">
            {AI_CAPABILITIES.map((cap) => (
              <div key={cap} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{CAPABILITY_LABEL[cap]}</span>
                <select
                  value={settings.hybridRouting[cap] ?? "ollama"}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      hybridRouting: { ...s.hybridRouting, [cap]: e.target.value as ProviderId },
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="ollama">Local (Ollama)</option>
                  <option value="gemini">Cloud (Gemini)</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={isPending} className="btn btn-primary px-5 py-2.5 text-sm">
          <Save className="h-4 w-4" strokeWidth={2} />
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
        {saveState === "saved" && (
          <span className="text-sm font-semibold text-[#15803d]">Tersimpan.</span>
        )}
        {saveState === "error" && (
          <span role="alert" className="text-sm font-semibold text-[#b91c1c]">
            {saveError}
          </span>
        )}
      </div>
    </div>
  );
}
