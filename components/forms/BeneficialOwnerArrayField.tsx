"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import { Plus, Trash2, UserPlus } from "lucide-react";
import { TextField, SelectField, FullRow } from "@/components/forms/fields";
import { EmptyState } from "@/components/ui/empty-state";
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
        <EmptyState
          icon={UserPlus}
          title="Belum ada Pemilik Manfaat ditambahkan"
          description="Bagian ini opsional."
        />
      )}
      <AnimatePresence initial={false}>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <BeneficialOwnerRow
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              index={index}
              onRemove={() => remove(index)}
              roleQuickSelect={roleQuickSelect}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => append(emptyBeneficialOwner as never)}
        className="btn btn-secondary px-4 py-2.5 text-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Tambah Pemilik Manfaat
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
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <UserPlus className="h-4 w-4" strokeWidth={2} />
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            {`Pemilik Manfaat #${index + 1}`}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Hapus Pemilik Manfaat #${index + 1}?`)) {
              onRemove();
            }
          }}
          aria-label={`Hapus Pemilik Manfaat #${index + 1}`}
          className="btn btn-ghost h-8 w-8 p-0 text-muted hover:bg-danger-subtle hover:text-danger"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
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
                  className="badge badge-neutral hover:bg-brand-subtle hover:text-brand-hover"
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
