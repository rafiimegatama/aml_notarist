import type { RiskCategory } from "@/lib/generated/prisma/enums";

// reference-data.md bagian 6 — Formula Skoring & Kategori Risiko
export const RISK_CATEGORY_RANGES: {
  category: RiskCategory;
  min: number;
  max: number;
}[] = [
  { category: "RENDAH", min: 12, max: 21 },
  { category: "SEDANG", min: 22, max: 31 },
  { category: "TINGGI", min: 32, max: 40 },
];

export function computeRiskCategory(totalScore: number): RiskCategory | null {
  const match = RISK_CATEGORY_RANGES.find(
    (r) => totalScore >= r.min && totalScore <= r.max
  );
  return match?.category ?? null;
}
