"use client";

import type {
  FieldErrors,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";
import { SectionCard, TextField } from "@/components/forms/fields";
import type { NotaryServiceFormValues } from "@/lib/validations";

type FormWithNotaryService = FieldValues & {
  notaryService: NotaryServiceFormValues;
};

// Section 1.E / 2.D / 3.E — Informasi Jasa Yang Diberikan (identik semua tipe Customer)
export function NotaryServiceFields<T extends FormWithNotaryService>({
  register,
  errors,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  const err = errors.notaryService as
    | FieldErrors<NotaryServiceFormValues>
    | undefined;
  return (
    <SectionCard title="Informasi Jasa yang Diberikan">
      <TextField
        label="Nama Notaris"
        error={err?.namaNotaris}
        registration={register("notaryService.namaNotaris" as FieldPath<T>)}
      />
      <TextField
        label="Jasa yang Diberikan"
        error={err?.jasaYangDiberikan}
        registration={register(
          "notaryService.jasaYangDiberikan" as FieldPath<T>
        )}
      />
    </SectionCard>
  );
}
