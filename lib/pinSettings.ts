import { prisma } from "@/lib/prisma";

const PIN_HASH_SETTING_KEY = "pin_hash";

/**
 * Nilai di AppSetting (hasil "Lupa PIN") menang atas PIN_HASH di .env kalau
 * ada — .env cuma jadi nilai bootstrap awal, dan tetap dibaca kalau reset
 * lewat DB belum pernah terjadi. Ini memisahkan modul ini dari lib/auth.ts
 * (yang harus tetap bebas dependency DB/Node — lihat komentar di sana)
 * supaya proxy.ts aman dibundle di runtime apa pun dia jalan.
 */
export async function getEffectivePinHash(): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({
    where: { key: PIN_HASH_SETTING_KEY },
  });
  return row?.value ?? process.env.PIN_HASH ?? null;
}

export async function setPinHash(hash: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: PIN_HASH_SETTING_KEY },
    create: { key: PIN_HASH_SETTING_KEY, value: hash },
    update: { value: hash },
  });
}
