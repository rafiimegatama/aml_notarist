"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { SectionCard, TextField } from "@/components/forms/fields";

// Section 1.E / 2.D / 3.E — Informasi Jasa Yang Diberikan (identik semua tipe Customer)
export function NotaryServiceFields({
  register,
  errors,
}: {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}) {
  const err = (errors as any)?.notaryService;
  return (
    <SectionCard title="Informasi Jasa yang Diberikan">
      <TextField
        label="Nama Notaris"
        error={err?.namaNotaris}
        registration={register("notaryService.namaNotaris")}
      />
      <TextField
        label="Jasa yang Diberikan"
        error={err?.jasaYangDiberikan}
        registration={register("notaryService.jasaYangDiberikan")}
      />
    </SectionCard>
  );
}
