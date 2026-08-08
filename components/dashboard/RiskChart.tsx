"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";

export interface RiskTrendPoint {
  date: string; // ISO yyyy-mm-dd
  label: string; // display label, e.g. "6 Agu"
  rendah: number;
  sedang: number;
  tinggi: number;
}

const RANGE_OPTIONS = [
  { days: 7, label: "7 Hari" },
  { days: 30, label: "30 Hari" },
  { days: 90, label: "90 Hari" },
] as const;

// Tiga kategori nyata dari RiskCategory enum (lib/status.ts) — TIDAK ada
// kategori "Critical" di mesin skoring yang sebenarnya, jadi sengaja tidak
// ditambahkan di sini supaya visualisasi tetap merepresentasikan data asli.
const SERIES: { key: keyof Omit<RiskTrendPoint, "date" | "label">; name: string; color: string }[] = [
  { key: "rendah", name: "Rendah", color: "#32966A" },
  { key: "sedang", name: "Sedang", color: "#C98A2E" },
  { key: "tinggi", name: "Tinggi", color: "#B94A48" },
];

export function RiskChart({ data }: { data: RiskTrendPoint[] }) {
  const [rangeDays, setRangeDays] = useState<number>(30);

  const sliced = useMemo(() => data.slice(-rangeDays), [data, rangeDays]);
  const isEmpty = sliced.every((d) => d.rendah + d.sedang + d.tinggi === 0);

  return (
    <div className="card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Tren CDD per Kategori Risiko</h2>
            <p className="mt-1 text-sm font-medium text-muted">Jumlah CDD dibuat, ditumpuk berdasarkan kategori risiko.</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setRangeDays(opt.days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                rangeDays === opt.days ? "bg-white text-brand-hover shadow-soft-sm" : "text-muted hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-72">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-muted">
            Belum ada data CDD pada rentang ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sliced} barSize={rangeDays > 30 ? 6 : 18} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                interval={rangeDays > 30 ? Math.ceil(rangeDays / 10) : "preserveStartEnd"}
              />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 12px 28px -6px rgb(15 23 42 / 0.1)",
                  fontSize: 12,
                }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
              />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} stackId="risk" fill={s.color} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
