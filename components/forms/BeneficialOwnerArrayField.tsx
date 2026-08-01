"use client";

import {
  useFieldArray,
  useWatch,
  type ArrayPath,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { TextField, SelectField, FullRow } from "@/components/forms/fields";
import { jenisIdentitasLabels, labelOptions } from "@/lib/labels";
import { isForeignNational } from "@/lib/wna";
import type { BeneficialOwnerFormValues } from "@/lib/validations";

const jenisIdentitasOptions = labelOptions(jenisIdentitasLabels);

// beneficialOwners punya `.default([])` di zod, jadi opsional di tipe input form.
type FormWithBeneficialOwners = FieldValues & {
  beneficialOwners?: BeneficialOwnerFormValues[];
};

const emptyBeneficialOwner: BeneficialOwnerFormValues = {
  namaLengkap: "",
  namaAlias: "",
  jenisIdentitas: "",
  noIdentitas: "",
  tempatLahir: "",
  tanggalLahir: "",
  kewarganegaraan: "",
  alamatTempatTinggal: "",
  alamatNegaraAsal: "",
  npwp: "",
  hubunganDenganPenggunaJasa: "",
};

// Section 1.C / 2.C / 3.C — "Informasi Pemilik Manfaat (Beneficial Owner)", bisa lebih dari satu.
export function BeneficialOwnerArrayField<T extends FormWithBeneficialOwners>({
  control,
  register,
  setValue,
  errors,
  roleQuickSelect,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  /** Section 3.C.C9: quick-select peran khusus Legal Arrangement (mengisi field teks yang sama). */
  roleQuickSelect?: readonly string[];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "beneficialOwners" as ArrayPath<T>,
  });

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-gray-500">
          Belum ada Pemilik Manfaat ditambahkan. Bagian ini opsional.
        </p>
      )}
      {fields.map((field, index) => (
        <BeneficialOwnerRow
          key={field.id}
          control={control}
          register={register}
          setValue={setValue}
          errors={errors}
          index={index}
          onRemove={() => remove(index)}
          roleQuickSelect={roleQuickSelect}
        />
      ))}
      <button
        type="button"
        onClick={() => append(emptyBeneficialOwner as never)}
        className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >
        + Tambah Pemilik Manfaat
      </button>
    </div>
  );
}

function BeneficialOwnerRow<T extends FormWithBeneficialOwners>({
  control,
  register,
  setValue,
  errors,
  index,
  onRemove,
  roleQuickSelect,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  index: number;
  onRemove: () => void;
  roleQuickSelect?: readonly string[];
}) {
  const kewarganegaraan = useWatch({
    control,
    name: `beneficialOwners.${index}.kewarganegaraan` as FieldPath<T>,
  });
  const boErrors = (
    errors.beneficialOwners as FieldErrors<BeneficialOwnerFormValues>[] | undefined
  )?.[index];

  const field = (name: string) =>
    register(`beneficialOwners.${index}.${name}` as FieldPath<T>);

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {`Pemilik Manfaat #${index + 1}`}
        </h3>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Hapus Pemilik Manfaat #${index + 1}?`)) {
              onRemove();
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
          error={boErrors?.namaLengkap}
          registration={field("namaLengkap")}
        />
        <TextField
          label="Nama Alias"
          error={boErrors?.namaAlias}
          registration={field("namaAlias")}
        />
        <SelectField
          label="Jenis Identitas"
          options={jenisIdentitasOptions}
          error={boErrors?.jenisIdentitas}
          registration={field("jenisIdentitas")}
        />
        <TextField
          label="No. Identitas"
          error={boErrors?.noIdentitas}
          registration={field("noIdentitas")}
        />
        <TextField
          label="Tempat Lahir"
          error={boErrors?.tempatLahir}
          registration={field("tempatLahir")}
        />
        <TextField
          label="Tanggal Lahir"
          type="date"
          error={boErrors?.tanggalLahir}
          registration={field("tanggalLahir")}
        />
        <TextField
          label="Kewarganegaraan"
          error={boErrors?.kewarganegaraan}
          registration={field("kewarganegaraan")}
        />
        <TextField
          label="NPWP"
          error={boErrors?.npwp}
          registration={field("npwp")}
        />
        <FullRow>
          <TextField
            label="Alamat Tempat Tinggal"
            error={boErrors?.alamatTempatTinggal}
            registration={field("alamatTempatTinggal")}
          />
        </FullRow>
        {isForeignNational(kewarganegaraan as string | undefined) && (
          <FullRow>
            <TextField
              label="Alamat di Negara Asal"
              hint="Ditampilkan karena Kewarganegaraan diisi selain Indonesia/WNI"
              error={boErrors?.alamatNegaraAsal}
              registration={field("alamatNegaraAsal")}
            />
          </FullRow>
        )}
        <FullRow>
          <TextField
            label="Hubungan dengan Pengguna Jasa"
            error={boErrors?.hubunganDenganPenggunaJasa}
            registration={field("hubunganDenganPenggunaJasa")}
          />
        </FullRow>
        {roleQuickSelect && (
          <FullRow>
            <div className="flex flex-wrap gap-2">
              {roleQuickSelect.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    setValue(
                      `beneficialOwners.${index}.hubunganDenganPenggunaJasa` as FieldPath<T>,
                      role as never,
                      { shouldValidate: true, shouldDirty: true }
                    )
                  }
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                >
                  {role}
                </button>
              ))}
            </div>
          </FullRow>
        )}
      </div>
    </div>
  );
}
