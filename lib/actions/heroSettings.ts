"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HERO_DIR } from "@/lib/storage";

const SETTINGS_KEY = "hero_banner";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB — cukup untuk foto latar resolusi tinggi
const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export interface HeroBannerSettings {
  enabled: boolean;
  filename: string | null;
  mimeType: string | null;
}

const DEFAULT_SETTINGS: HeroBannerSettings = { enabled: false, filename: null, mimeType: null };

export async function getHeroBannerSettings(): Promise<HeroBannerSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<HeroBannerSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: HeroBannerSettings): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
}

export type UploadHeroImageResult = { success: true } | { success: false; error: string };

export async function uploadHeroImage(formData: FormData): Promise<UploadHeroImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Pilih gambar terlebih dahulu." };
  }
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return { success: false, error: "Format gambar harus PNG, JPG, atau WEBP." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "Ukuran gambar maksimal 8MB." };
  }

  const current = await getHeroBannerSettings();
  await mkdir(HERO_DIR, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(HERO_DIR, filename), buffer);

  if (current.filename) {
    await unlink(path.join(HERO_DIR, current.filename)).catch(() => {
      // file lama sudah tidak ada/tidak bisa dihapus — tidak fatal, lanjut timpa pengaturan
    });
  }

  await saveSettings({ enabled: true, filename, mimeType: file.type });
  revalidatePath("/");
  revalidatePath("/admin/appearance");
  return { success: true };
}

export async function setHeroBannerEnabled(enabled: boolean): Promise<void> {
  const current = await getHeroBannerSettings();
  await saveSettings({ ...current, enabled });
  revalidatePath("/");
  revalidatePath("/admin/appearance");
}

/** "Hapus" dan "Kembalikan Default" adalah aksi yang sama — tidak ada aset gambar bawaan, jadi default = gradient polos (lihat HeroBanner.tsx). */
export async function deleteHeroImage(): Promise<void> {
  const current = await getHeroBannerSettings();
  if (current.filename) {
    await unlink(path.join(HERO_DIR, current.filename)).catch(() => {});
  }
  await saveSettings(DEFAULT_SETTINGS);
  revalidatePath("/");
  revalidatePath("/admin/appearance");
}
