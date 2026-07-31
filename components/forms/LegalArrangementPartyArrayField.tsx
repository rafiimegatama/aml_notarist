"use client";

import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import { TextField, SelectField, FullRow } from "@/components/forms/fields";
import { jenisIdentitasLabels, labelOptions } from "@/lib/labels";

const jenisIdentitasOptions = labelOptions(jenisIdentitasLabels);

// Section 3.D — Informasi Pihak dalam Legal Arrangement, bisa lebih dari satu.
export function LegalArrangementPartyArrayField({
  control,
  register,
  errors,
}: {
  control: Control<any, any, any>;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parties",
  });

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-gray-500">Belum ada pihak ditambahkan.</p>
      )}
      {fields.map((field, index) => {
        const partyErrors = (errors as any)?.parties?.[index];
        return (
          <div key={field.id} className="rounded-md border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Pihak #{index + 1}
              </h3>
              <button
                type="button"
                onClick={() => remove(index)}
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
                registration={register(`parties.${index}.namaLengkap`)}
              />
              <TextField
                label="Nama Alias"
                error={partyErrors?.namaAlias}
                registration={register(`parties.${index}.namaAlias`)}
              />
              <SelectField
                label="Jenis Identitas"
                options={jenisIdentitasOptions}
                error={partyErrors?.jenisIdentitas}
                registration={register(`parties.${index}.jenisIdentitas`)}
              />
              <TextField
                label="No. Identitas"
                error={partyErrors?.noIdentitas}
                registration={register(`parties.${index}.noIdentitas`)}
              />
              <TextField
                label="Tempat Lahir"
                error={partyErrors?.tempatLahir}
                registration={register(`parties.${index}.tempatLahir`)}
              />
              <TextField
                label="Tanggal Lahir"
                type="date"
                error={partyErrors?.tanggalLahir}
                registration={register(`parties.${index}.tanggalLahir`)}
              />
              <TextField
                label="Kewarganegaraan"
                error={partyErrors?.kewarganegaraan}
                registration={register(`parties.${index}.kewarganegaraan`)}
              />
              <TextField
                label="Hubungan Hukum Pengguna Jasa"
                error={partyErrors?.hubunganHukumPenggunaJasa}
                registration={register(
                  `parties.${index}.hubunganHukumPenggunaJasa`
                )}
              />
              <FullRow>
                <TextField
                  label="Alamat Tempat Tinggal"
                  error={partyErrors?.alamatTempatTinggal}
                  registration={register(
                    `parties.${index}.alamatTempatTinggal`
                  )}
                />
              </FullRow>
              <TextField
                label="No. Perjanjian"
                error={partyErrors?.noPerjanjian}
                registration={register(`parties.${index}.noPerjanjian`)}
              />
              <TextField
                label="Tanggal Perjanjian"
                type="date"
                error={partyErrors?.tanggalPerjanjian}
                registration={register(`parties.${index}.tanggalPerjanjian`)}
              />
              <FullRow>
                <TextField
                  label="Penandatanganan Perjanjian"
                  error={partyErrors?.penandatangananPerjanjian}
                  registration={register(
                    `parties.${index}.penandatangananPerjanjian`
                  )}
                />
              </FullRow>
            </div>
          </div>
        );
      })}
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
            hubunganHukumPenggunaJasa: "",
            noPerjanjian: "",
            tanggalPerjanjian: "",
            penandatangananPerjanjian: "",
          })
        }
        className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >
        + Tambah Pihak
      </button>
    </div>
  );
}
