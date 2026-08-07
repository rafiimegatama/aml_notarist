"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useFieldArray,
  type ArrayPath,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form";
import { Plus, Trash2, Users } from "lucide-react";
import { TextField, SelectField, FullRow } from "@/components/forms/fields";
import { EmptyState } from "@/components/ui/empty-state";
import { jenisIdentitasLabels, labelOptions } from "@/lib/labels";
import type { LegalArrangementPartyFormValues } from "@/lib/validations";

const jenisIdentitasOptions = labelOptions(jenisIdentitasLabels);

// parties punya `.default([])` di zod, jadi opsional di tipe input form.
type FormWithParties = FieldValues & {
  parties?: LegalArrangementPartyFormValues[];
};

const emptyParty: LegalArrangementPartyFormValues = {
  namaLengkap: "",
  namaAlias: "",
  jenisIdentitas: "",
  noIdentitas: "",
  tempatLahir: "",
  tanggalLahir: "",
  kewarganegaraan: "",
  alamatTempatTinggal: "",
  hubunganHukumPenggunaJasa: "",
  noPerjanjian: "",
  tanggalPerjanjian: "",
  penandatangananPerjanjian: "",
};

// Section 3.D — Informasi Pihak dalam Legal Arrangement, bisa lebih dari satu.
export function LegalArrangementPartyArrayField<T extends FormWithParties>({
  control,
  register,
  errors,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parties" as ArrayPath<T>,
  });

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <EmptyState icon={Users} title="Belum ada pihak ditambahkan" />
      )}
      <AnimatePresence initial={false}>
        {fields.map((field, index) => {
          const partyErrors = (
            errors.parties as
              | FieldErrors<LegalArrangementPartyFormValues>[]
              | undefined
          )?.[index];
          const partyField = (name: string) =>
            register(`parties.${index}.${name}` as FieldPath<T>);
          return (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="card p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
                      <Users className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {`Pihak #${index + 1}`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus Pihak #${index + 1}?`)) {
                        remove(index);
                      }
                    }}
                    aria-label={`Hapus Pihak #${index + 1}`}
                    className="btn btn-ghost h-8 w-8 p-0 text-muted hover:bg-danger-subtle hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <TextField
                    label="Nama Lengkap"
                    required
                    error={partyErrors?.namaLengkap}
                    registration={partyField("namaLengkap")}
                  />
                  <TextField
                    label="Nama Alias"
                    error={partyErrors?.namaAlias}
                    registration={partyField("namaAlias")}
                  />
                  <SelectField
                    label="Jenis Identitas"
                    options={jenisIdentitasOptions}
                    error={partyErrors?.jenisIdentitas}
                    registration={partyField("jenisIdentitas")}
                  />
                  <TextField
                    label="No. Identitas"
                    error={partyErrors?.noIdentitas}
                    registration={partyField("noIdentitas")}
                  />
                  <TextField
                    label="Tempat Lahir"
                    error={partyErrors?.tempatLahir}
                    registration={partyField("tempatLahir")}
                  />
                  <TextField
                    label="Tanggal Lahir"
                    type="date"
                    error={partyErrors?.tanggalLahir}
                    registration={partyField("tanggalLahir")}
                  />
                  <TextField
                    label="Kewarganegaraan"
                    error={partyErrors?.kewarganegaraan}
                    registration={partyField("kewarganegaraan")}
                  />
                  <TextField
                    label="Hubungan Hukum Pengguna Jasa"
                    error={partyErrors?.hubunganHukumPenggunaJasa}
                    registration={partyField("hubunganHukumPenggunaJasa")}
                  />
                  <FullRow>
                    <TextField
                      label="Alamat Tempat Tinggal"
                      error={partyErrors?.alamatTempatTinggal}
                      registration={partyField("alamatTempatTinggal")}
                    />
                  </FullRow>
                  <TextField
                    label="No. Perjanjian"
                    error={partyErrors?.noPerjanjian}
                    registration={partyField("noPerjanjian")}
                  />
                  <TextField
                    label="Tanggal Perjanjian"
                    type="date"
                    error={partyErrors?.tanggalPerjanjian}
                    registration={partyField("tanggalPerjanjian")}
                  />
                  <FullRow>
                    <TextField
                      label="Penandatanganan Perjanjian"
                      error={partyErrors?.penandatangananPerjanjian}
                      registration={partyField("penandatangananPerjanjian")}
                    />
                  </FullRow>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => append(emptyParty as never)}
        className="btn btn-secondary px-4 py-2.5 text-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Tambah Pihak
      </button>
    </div>
  );
}
