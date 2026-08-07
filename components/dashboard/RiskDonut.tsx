"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export interface RiskDistribution {
  rendah: number;
  sedang: number;
  tinggi: number;
  belumDinilai: number;
}

const SLICES: { key: keyof RiskDistribution; name: string; color: string }[] = [
  { key: "tinggi", name: "Tinggi", color: "#dc2626" },
  { key: "sedang", name: "Sedang", color: "#f59e0b" },
  { key: "rendah", name: "Rendah", color: "#16a34a" },
  { key: "belumDinilai", name: "Belum Dinilai", color: "#cbd5e1" },
];

export function RiskDonut({ distribution }: { distribution: RiskDistribution }) {
  const total = distribution.rendah + distribution.sedang + distribution.tinggi + distribution.belumDinilai;
  const data = SLICES.map((s) => ({ ...s, value: distribution[s.key] })).filter((s) => s.value > 0);

  return (
    <div className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <PieChartIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Distribusi Risiko</h2>
          <p className="mt-1 text-sm font-medium text-muted">Seluruh CDD, berdasarkan kategori risiko saat ini.</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-4">
          <EmptyState icon={PieChartIcon} title="Belum ada data" description="Distribusi muncul setelah CDD pertama dibuat." />
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={2} strokeWidth={0}>
                  {data.map((s) => (
                    <Cell key={s.key} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(value, name) => [`${value} CDD`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-slate-900">{total}</span>
              <span className="text-[11px] font-semibold text-muted">Total CDD</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {SLICES.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="tabular-nums font-semibold text-slate-900">{distribution[s.key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
