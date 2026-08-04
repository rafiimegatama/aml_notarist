"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nullifyEmpty } from "@/lib/actions/shared";
import { logActivity } from "@/lib/activityLog";

/**
 * FR-8 — tandai/batalkan tanda LTKM (Laporan Transaksi Keuangan Mencurigakan)
 * pada satu Customer, dengan catatan bebas untuk konteks/alasan. Murni
 * penanda manual oleh notaris untuk membantu menyiapkan submission goAML
 * manual ke PPATK (bukan integrasi goAML — lihat FR-10, di luar cakupan ini).
 */
export async function setLtkmFlag(
  customerId: string,
  isLtkm: boolean,
  notes: string
): Promise<void> {
  const data = nullifyEmpty({ ltkmNotes: notes });

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      isLtkm,
      // nullifyEmpty turns "" into undefined, which is correct for the
      // create/upsert calls it's normally used with (undefined = "use
      // default"). Here it's a plain update with no other fields, so
      // undefined would mean "leave the previous value untouched" instead
      // of clearing it — coalesce back to an explicit null.
      ltkmNotes: data.ltkmNotes ?? null,
    },
  });

  await logActivity(
    customerId,
    isLtkm ? "Ditandai sebagai LTKM" : "Tanda LTKM dihapus"
  );

  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
}
