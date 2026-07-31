"use client";

import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type FieldErrors,
} from "react-hook-form";
import { TextField, SelectField, FullRow } from "@/components/forms/fields";
import { jenisIdentitasLabels, labelOptions } from "@/lib/labels";
import { isForeignNational } from "@/lib/wna";

const jenisIdentitasOptions = labelOptions(jenisIdentitasLabels);

// Section 1.C / 2.C / 3.C — "Informasi Pemilik Manfaat (Beneficial Owner)", bisa lebih dari satu.
export function BeneficialOwnerArrayField({
  control,
  register,
  setValue,
  errors,
  roleQuickSelect,
}: {
  control: Control<any, any, any>;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  /** Section 3.C.C9: quick-select peran khusus Legal Arrangement (mengisi field teks yang sama). */
  roleQuickSelect?: readonly string[];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "beneficialOwners",
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
        onClick={() =>
          append({
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
          })
        }
        className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >
        + Tambah Pemilik Manfaat
      </button>
    </div>
  );
}

function BeneficialOwnerRow({
  control,
  register,
  setValue,
  errors,
  index,
  onRemove,
  roleQuickSelect,
}: {
  control: Control<any, any, any>;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  index: number;
  onRemove: () => void;
  roleQuickSelect?: readonly string[];
}) {
  const kewarganegaraan = useWatch({
    control,
    name: `beneficialOwners.${index}.kewarganegaraan`,
  });
  const boErrors = (errors as any)?.beneficialOwners?.[index];

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Pemilik Manfaat #{index + 1}
        </h3>
        <button
          type="button"
          onClick={onRemove}
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
          registration={register(`beneficialOwners.${index}.namaLengkap`)}
        />
        <TextField
          label="Nama Alias"
          error={boErrors?.namaAlias}
          registration={register(`beneficialOwners.${index}.namaAlias`)}
        />
        <SelectField
          label="Jenis Identitas"
          options={jenisIdentitasOptions}
          error={boErrors?.jenisIdentitas}
          registration={register(`beneficialOwners.${index}.jenisIdentitas`)}
        />
        <TextField
          label="No. Identitas"
          error={boErrors?.noIdentitas}
          registration={register(`beneficialOwners.${index}.noIdentitas`)}
        />
        <TextField
          label="Tempat Lahir"
          error={boErrors?.tempatLahir}
          registration={register(`beneficialOwners.${index}.tempatLahir`)}
        />
        <TextField
          label="Tanggal Lahir"
          type="date"
          error={boErrors?.tanggalLahir}
          registration={register(`beneficialOwners.${index}.tanggalLahir`)}
        />
        <TextField
          label="Kewarganegaraan"
          error={boErrors?.kewarganegaraan}
          registration={register(`beneficialOwners.${index}.kewarganegaraan`)}
        />
        <TextField
          label="NPWP"
          error={boErrors?.npwp}
          registration={register(`beneficialOwners.${index}.npwp`)}
        />
        <FullRow>
          <TextField
            label="Alamat Tempat Tinggal"
            error={boErrors?.alamatTempatTinggal}
            registration={register(
              `beneficialOwners.${index}.alamatTempatTinggal`
            )}
          />
        </FullRow>
        {isForeignNational(kewarganegaraan) && (
          <FullRow>
            <TextField
              label="Alamat di Negara Asal"
              hint="Ditampilkan karena Kewarganegaraan diisi selain Indonesia/WNI"
              error={boErrors?.alamatNegaraAsal}
              registration={register(
                `beneficialOwners.${index}.alamatNegaraAsal`
              )}
            />
          </FullRow>
        )}
        <FullRow>
          <TextField
            label="Hubungan dengan Pengguna Jasa"
            error={boErrors?.hubunganDenganPenggunaJasa}
            registration={register(
              `beneficialOwners.${index}.hubunganDenganPenggunaJasa`
            )}
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
                      `beneficialOwners.${index}.hubunganDenganPenggunaJasa`,
                      role,
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
