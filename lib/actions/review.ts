"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";

// FR-7 — dipanggil dari tombol "Tandai Sudah Ditinjau" di halaman detail.
// Bukan submit form (tidak ada data untuk divalidasi), jadi tidak perlu
// redirect — cukup revalidate supaya "Tinjau ulang berikutnya" ter-refresh.
export async function markCustomerReviewed(customerId: string): Promise<void> {
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastReviewedAt: new Date() },
  });
  await logActivity(customerId, "Ditinjau ulang (PMPJ)");
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
}
