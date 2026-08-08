"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Layers } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export interface RiskByTypePoint {
  type: string; // display label, e.g. "Perorangan"
  rendah: number;
  sedang: number;
  tinggi: number;
  belumDinilai: number;
}

// Palet sama persis dengan RiskChart/RiskDonut supaya "Tinggi"/"Sedang"/
// "Rendah" konsisten warnanya di seluruh dashboard — hanya dimensi
// pengelompokannya yang beda (jenis customer, bukan waktu).
const SERIES: { key: keyof Omit<RiskByTypePoint, "type">; name: string; color: string }[] = [
  { key: "tinggi", name: "Tinggi", color: "#B94A48" },
  { key: "sedang", name: "Sedang", color: "#C98A2E" },
  { key: "rendah", name: "Rendah", color: "#32966A" },
  { key: "belumDinilai", name: "Belum Dinilai", color: "#CBD5E1" },
];

export function RiskByTypeChart({ data }: { data: RiskByTypePoint[] }) {
  const total = data.reduce(
    (sum, d) => sum + d.rendah + d.sedang + d.tinggi + d.belumDinilai,
    0
  );

  return (
    <div className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <Layers className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Komposisi Risiko per Jenis Customer</h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Jumlah CDD per jenis (Korporasi/Perorangan/Perikatan Lainnya), ditumpuk berdasarkan kategori risiko.
          </p>
        </div>
      </div>

      <div className="mt-6 h-72">
        {total === 0 ? (
          <EmptyState
            icon={Layers}
            title="Belum ada data"
            description="Komposisi muncul setelah CDD pertama dibuat."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={56} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
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
                <Bar key={s.key} dataKey={s.key} name={s.name} stackId="riskByType" fill={s.color} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
