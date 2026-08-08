import type { JenisIdentitas } from "@/lib/generated/prisma/enums";
import type { BeneficialOwnerFormValues } from "@/lib/validations";

/**
 * Helper mapping Prisma -> form values, dipakai bersama oleh
 * lib/actions/duplicateLookup.ts (prefill dari klien lama, "use server") dan
 * lib/actions/customerEdit.ts (load untuk halaman edit, "use server") — file
 * INI sengaja bukan "use server": fungsi sinkron biasa tidak boleh diexport
 * dari file "use server" (Next.js mewajibkan semua export dari file
 * ber-directive itu jadi Server Action async), jadi helper murni harus
 * tinggal di modul biasa seperti ini.
 */

export function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function mapBeneficialOwner(bo: {
  namaLengkap: string;
  namaAlias: string | null;
  jenisIdentitas: JenisIdentitas | null;
  noIdentitas: string | null;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  kewarganegaraan: string | null;
  alamatTempatTinggal: string | null;
  alamatNegaraAsal: string | null;
  npwp: string | null;
  hubunganDenganPenggunaJasa: string | null;
}): BeneficialOwnerFormValues {
  return {
    namaLengkap: bo.namaLengkap,
    namaAlias: bo.namaAlias ?? "",
    jenisIdentitas: bo.jenisIdentitas ?? "",
    noIdentitas: bo.noIdentitas ?? "",
    tempatLahir: bo.tempatLahir ?? "",
    tanggalLahir: toDateInputValue(bo.tanggalLahir),
    kewarganegaraan: bo.kewarganegaraan ?? "",
    alamatTempatTinggal: bo.alamatTempatTinggal ?? "",
    alamatNegaraAsal: bo.alamatNegaraAsal ?? "",
    npwp: bo.npwp ?? "",
    hubunganDenganPenggunaJasa: bo.hubunganDenganPenggunaJasa ?? "",
  };
}
