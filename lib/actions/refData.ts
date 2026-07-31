"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { REF_TABLE_CONFIG, type RefTableKey } from "@/lib/refTableConfig";

function getDelegate(key: RefTableKey) {
  switch (key) {
    case "userProfile":
      return prisma.refUserProfileScore;
    case "businessSector":
      return prisma.refBusinessSectorScore;
    case "region":
      return prisma.refRegionScore;
    case "country":
      return prisma.refCountryScore;
    case "notaryServiceType":
      return prisma.refNotaryServiceTypeScore;
  }
}

export type RefRowActionResult =
  | { success: true }
  | { success: false; error: string };

export async function addRefScoreRow(
  tableKey: RefTableKey,
  input: { categoryName: string; score: string }
): Promise<RefRowActionResult> {
  const categoryName = input.categoryName.trim();
  if (!categoryName) {
    return { success: false, error: "Nama kategori wajib diisi." };
  }

  const config = REF_TABLE_CONFIG[tableKey];
  const scoreTrimmed = input.score.trim();
  if (config.scoreRequired && scoreTrimmed === "") {
    return { success: false, error: "Skor wajib diisi." };
  }
  const score = scoreTrimmed === "" ? null : Number(scoreTrimmed);
  if (score !== null && !Number.isInteger(score)) {
    return { success: false, error: "Skor harus berupa angka bulat." };
  }

  const delegate = getDelegate(tableKey);
  await (delegate as { create: (args: unknown) => Promise<unknown> }).create({
    data: { categoryName, score, isActive: true },
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
  const categoryName = input.categoryName.trim();
  if (!categoryName) {
    return { success: false, error: "Nama kategori wajib diisi." };
  }

  const config = REF_TABLE_CONFIG[tableKey];
  const scoreTrimmed = input.score.trim();
  if (config.scoreRequired && scoreTrimmed === "") {
    return { success: false, error: "Skor wajib diisi." };
  }
  const score = scoreTrimmed === "" ? null : Number(scoreTrimmed);
  if (score !== null && !Number.isInteger(score)) {
    return { success: false, error: "Skor harus berupa angka bulat." };
  }

  const delegate = getDelegate(tableKey);
  await (
    delegate as { update: (args: unknown) => Promise<unknown> }
  ).update({ where: { id }, data: { categoryName, score } });

  revalidatePath("/admin/referensi");
  revalidatePath("/");
  return { success: true };
}

export async function setRefScoreRowActive(
  tableKey: RefTableKey,
  id: string,
  isActive: boolean
): Promise<RefRowActionResult> {
  const delegate = getDelegate(tableKey);
  await (
    delegate as { update: (args: unknown) => Promise<unknown> }
  ).update({ where: { id }, data: { isActive } });

  revalidatePath("/admin/referensi");
  revalidatePath("/");
  return { success: true };
}
