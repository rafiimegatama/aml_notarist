"use client";

import {
  useFieldArray,
  type ArrayPath,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form";
import { TextField, SelectField, FullRow } from "@/components/forms/fields";
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
        <p className="text-sm text-gray-500">Belum ada pihak ditambahkan.</p>
      )}
      {fields.map((field, index) => {
        const partyErrors = (
          errors.parties as
            | FieldErrors<LegalArrangementPartyFormValues>[]
            | undefined
        )?.[index];
        const partyField = (name: string) =>
          register(`parties.${index}.${name}` as FieldPath<T>);
        return (
          <div key={field.id} className="rounded-md border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {`Pihak #${index + 1}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus Pihak #${index + 1}?`)) {
                    remove(index);
                  }
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Hapus
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        );
      })}
      <button
        type="button"
        onClick={() => append(emptyParty as never)}
        className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >
        + Tambah Pihak
      </button>
    </div>
  );
}
