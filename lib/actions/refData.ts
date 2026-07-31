"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  REF_TABLE_CONFIG,
  REF_TABLE_KEYS,
  type RefTableKey,
} from "@/lib/refTableConfig";

export type RefRowActionResult =
  | { success: true }
  | { success: false; error: string };

// `score` cuma nullable (Int?) di RefBusinessSectorScore — 4 tabel lain
// mewajibkannya (Int) di schema.prisma. parseCategoryAndScore() sudah menjamin
// score tidak pernah null untuk tabel yang scoreRequired, jadi cast di titik
// panggil ini aman; lihat REF_TABLE_CONFIG.scoreRequired.
type RefScoreDelegate = {
  create: (args: {
    data: { categoryName: string; score: unknown; isActive: true };
  }) => Promise<unknown>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
};

function getDelegate(key: RefTableKey): RefScoreDelegate {
  // Prisma generates a distinct create/update input type per model (score is
  // required Int on 4 of the 5 tables, nullable only on RefBusinessSectorScore),
  // so no single structural type unifies them exactly — cast through `unknown`
  // at this one boundary rather than loosening the types callers see.
  switch (key) {
    case "userProfile":
      return prisma.refUserProfileScore as unknown as RefScoreDelegate;
    case "businessSector":
      return prisma.refBusinessSectorScore as unknown as RefScoreDelegate;
    case "region":
      return prisma.refRegionScore as unknown as RefScoreDelegate;
    case "country":
      return prisma.refCountryScore as unknown as RefScoreDelegate;
    case "notaryServiceType":
      return prisma.refNotaryServiceTypeScore as unknown as RefScoreDelegate;
  }
}

/** tableKey berasal dari client — divalidasi ulang di server, bukan cuma dipercaya dari tipe TS. */
function isValidTableKey(key: unknown): key is RefTableKey {
  return (
    typeof key === "string" && (REF_TABLE_KEYS as readonly string[]).includes(key)
  );
}

function parseCategoryAndScore(
  tableKey: RefTableKey,
  input: { categoryName: string; score: string }
):
  | { ok: true; categoryName: string; score: number | null }
  | { ok: false; error: string } {
  const categoryName = input.categoryName.trim();
  if (!categoryName) {
    return { ok: false, error: "Nama kategori wajib diisi." };
  }

  const scoreTrimmed = input.score.trim();
  if (REF_TABLE_CONFIG[tableKey].scoreRequired && scoreTrimmed === "") {
    return { ok: false, error: "Skor wajib diisi." };
  }
  const score = scoreTrimmed === "" ? null : Number(scoreTrimmed);
  if (score !== null && !Number.isInteger(score)) {
    return { ok: false, error: "Skor harus berupa angka bulat." };
  }

  return { ok: true, categoryName, score };
}

export async function addRefScoreRow(
  tableKey: RefTableKey,
  input: { categoryName: string; score: string }
): Promise<RefRowActionResult> {
  if (!isValidTableKey(tableKey)) {
    return { success: false, error: "Tabel referensi tidak dikenali." };
  }
  const parsed = parseCategoryAndScore(tableKey, input);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  await getDelegate(tableKey).create({
    data: {
      categoryName: parsed.categoryName,
      score: parsed.score,
      isActive: true,
    },
  });

  revalidatePath("/admin/referensi");
  revalidatePath("/");
  return { success: true };
}

export async function updateRefScoreRow(
  tableKey: RefTableKey,
  id: string,
  input: { categoryName: string; score: string }
): Promise<RefRowActionResult> {
  if (!isValidTableKey(tableKey)) {
    return { success: false, error: "Tabel referensi tidak dikenali." };
  }
  const parsed = parseCategoryAndScore(tableKey, input);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  await getDelegate(tableKey).update({
    where: { id },
    data: { categoryName: parsed.categoryName, score: parsed.score },
  });

  revalidatePath("/admin/referensi");
  revalidatePath("/");
  return { success: true };
}

export async function setRefScoreRowActive(
  tableKey: RefTableKey,
  id: string,
  isActive: boolean
): Promise<RefRowActionResult> {
  if (!isValidTableKey(tableKey)) {
    return { success: false, error: "Tabel referensi tidak dikenali." };
  }

  await getDelegate(tableKey).update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/referensi");
  revalidatePath("/");
  return { success: true };
}
