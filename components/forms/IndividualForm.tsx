"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  individualFormSchema,
  type IndividualFormValues,
  type IndividualFormOutput,
} from "@/lib/validations";
import { createIndividualCustomer } from "@/lib/actions/customer";
import type { DraftDocument } from "@/lib/actions/document";
import {
  SectionCard,
  TextField,
  TextAreaField,
  SelectField,
  FullRow,
} from "@/components/forms/fields";
import { BeneficialOwnerArrayField } from "@/components/forms/BeneficialOwnerArrayField";
import { NotaryServiceFields } from "@/components/forms/NotaryServiceFields";
import { OcrAssistBanner } from "@/components/forms/OcrAssistBanner";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import { applyFieldGuesses } from "@/lib/ocr/applyFieldGuesses";
import {
  jenisIdentitasLabels,
  jenisKelaminLabels,
  statusPernikahanLabels,
  sumberPendapatanLabels,
  pendapatanRangeLabels,
  labelOptions,
} from "@/lib/labels";
import { isForeignNational } from "@/lib/wna";

const jenisIdentitasOptions = labelOptions(jenisIdentitasLabels);
const jenisKelaminOptions = labelOptions(jenisKelaminLabels);
const statusPernikahanOptions = labelOptions(statusPernikahanLabels);
const sumberPendapatanOptions = labelOptions(sumberPendapatanLabels);
const pendapatanRangeOptions = labelOptions(pendapatanRangeLabels);

const defaultValues: IndividualFormValues = {
  individualDetail: {
    namaLengkap: "",
    namaAlias: "",
    jenisIdentitas: "",
    noIdentitas: "",
    npwp: "",
    tempatLahir: "",
    tanggalLahir: "",
    kewarganegaraan: "",
    alamatTempatTinggal: "",
    alamatDomisili: "",
    alamatNegaraAsal: "",
    nomorTeleponRumah: "",
    nomorHp: "",
    jenisKelamin: "",
    statusPernikahan: "",
    statusPernikahanLainnya: "",
    sumberPendapatan: "",
    sumberPendapatanLainnya: "",
    bidangUsaha: "",
    namaKantor: "",
    alamatKantor: "",
    nomorTeleponKantor: "",
    jabatan: "",
    pendapatanRataRata: "",
    tujuanTransaksi: "",
  },
  beneficialOwners: [],
  notaryService: {
    namaNotaris: "",
    jasaYangDiberikan: "",
  },
};

export function IndividualForm({
  ocrDraft,
}: {
  ocrDraft?: DraftDocument | null;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<IndividualFormValues, unknown, IndividualFormOutput>({
    resolver: zodResolver(individualFormSchema),
    defaultValues: ocrDraft
      ? applyFieldGuesses(defaultValues, ocrDraft.fieldGuesses)
      : defaultValues,
  });

  useUnsavedChangesWarning(isDirty && !isSubmitSuccessful);

  const kewarganegaraan = useWatch({
    control,
    name: "individualDetail.kewarganegaraan",
  });
  const statusPernikahan = useWatch({
    control,
    name: "individualDetail.statusPernikahan",
  });
  const sumberPendapatan = useWatch({
    control,
    name: "individualDetail.sumberPendapatan",
  });

  const onSubmit = handleSubmit(async (values: IndividualFormOutput) => {
    setFormError(null);
    const result = await createIndividualCustomer(values, ocrDraft?.id);
    if (!result.success) {
      setFormError(
        result.formError ?? "Periksa kembali isian yang bertanda merah."
      );
      const fieldPaths = Object.entries(result.fieldErrors);
      for (const [path, message] of fieldPaths) {
        setError(path as never, { message });
      }
      if (fieldPaths.length > 0) {
        setFocus(fieldPaths[0][0] as never);
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      {ocrDraft && <OcrAssistBanner rawText={ocrDraft.rawText} />}

      <SectionCard
        title="A. Informasi Dasar Pengguna Jasa"
        description="CDD Perorangan — Section 2.A"
      >
        <TextField
          label="Nama Lengkap"
          required
          error={errors.individualDetail?.namaLengkap}
          registration={register("individualDetail.namaLengkap")}
        />
        <TextField
          label="Nama Alias"
          error={errors.individualDetail?.namaAlias}
          registration={register("individualDetail.namaAlias")}
        />
        <SelectField
          label="Jenis Identitas"
          required
          options={jenisIdentitasOptions}
          error={errors.individualDetail?.jenisIdentitas}
          registration={register("individualDetail.jenisIdentitas")}
        />
        <TextField
          label="No. Identitas"
          error={errors.individualDetail?.noIdentitas}
          registration={register("individualDetail.noIdentitas")}
        />
        <TextField
          label="NPWP"
          error={errors.individualDetail?.npwp}
          registration={register("individualDetail.npwp")}
        />
        <TextField
          label="Tempat Lahir"
          error={errors.individualDetail?.tempatLahir}
          registration={register("individualDetail.tempatLahir")}
        />
        <TextField
          label="Tanggal Lahir"
          type="date"
          error={errors.individualDetail?.tanggalLahir}
          registration={register("individualDetail.tanggalLahir")}
        />
        <TextField
          label="Kewarganegaraan"
          error={errors.individualDetail?.kewarganegaraan}
          registration={register("individualDetail.kewarganegaraan")}
        />
        <SelectField
          label="Jenis Kelamin"
          required
          options={jenisKelaminOptions}
          error={errors.individualDetail?.jenisKelamin}
          registration={register("individualDetail.jenisKelamin")}
        />
        <div className="flex flex-col gap-4">
          <SelectField
            label="Status Pernikahan"
            required
            options={statusPernikahanOptions}
            error={errors.individualDetail?.statusPernikahan}
            registration={register("individualDetail.statusPernikahan")}
          />
          {statusPernikahan === "LAINNYA" && (
            <TextField
              label="Status Pernikahan Lainnya"
              error={errors.individualDetail?.statusPernikahanLainnya}
              registration={register(
                "individualDetail.statusPernikahanLainnya"
              )}
            />
          )}
        </div>
        <FullRow>
          <TextAreaField
            label="Alamat Tempat Tinggal"
            error={errors.individualDetail?.alamatTempatTinggal}
            registration={register("individualDetail.alamatTempatTinggal")}
          />
        </FullRow>
        <FullRow>
          <TextAreaField
            label="Alamat Domisili"
            error={errors.individualDetail?.alamatDomisili}
            registration={register("individualDetail.alamatDomisili")}
          />
        </FullRow>
        {isForeignNational(kewarganegaraan) && (
          <FullRow>
            <TextAreaField
              label="Alamat di Negara Asal"
              hint="Ditampilkan karena Kewarganegaraan diisi selain Indonesia/WNI"
              error={errors.individualDetail?.alamatNegaraAsal}
              registration={register("individualDetail.alamatNegaraAsal")}
            />
          </FullRow>
        )}
        <TextField
          label="Nomor Telepon Rumah"
          error={errors.individualDetail?.nomorTeleponRumah}
          registration={register("individualDetail.nomorTeleponRumah")}
        />
        <TextField
          label="Nomor HP"
          error={errors.individualDetail?.nomorHp}
          registration={register("individualDetail.nomorHp")}
        />
      </SectionCard>

      <SectionCard
        title="B. Informasi Pekerjaan dan Sumber Pendapatan"
        description="CDD Perorangan — Section 2.B"
      >
        <div className="flex flex-col gap-4">
          <SelectField
            label="Sumber Pendapatan/Kekayaan"
            options={sumberPendapatanOptions}
            error={errors.individualDetail?.sumberPendapatan}
            registration={register("individualDetail.sumberPendapatan")}
          />
          {sumberPendapatan === "LAINNYA" && (
            <TextField
              label="Sumber Pendapatan Lainnya"
              error={errors.individualDetail?.sumberPendapatanLainnya}
              registration={register(
                "individualDetail.sumberPendapatanLainnya"
              )}
            />
          )}
        </div>
        <TextField
          label="Bidang Usaha"
          error={errors.individualDetail?.bidangUsaha}
          registration={register("individualDetail.bidangUsaha")}
        />
        <TextField
          label="Nama Kantor"
          error={errors.individualDetail?.namaKantor}
          registration={register("individualDetail.namaKantor")}
        />
        <TextField
          label="Nomor Telepon Kantor"
          error={errors.individualDetail?.nomorTeleponKantor}
          registration={register("individualDetail.nomorTeleponKantor")}
        />
        <TextField
          label="Jabatan"
          error={errors.individualDetail?.jabatan}
          registration={register("individualDetail.jabatan")}
        />
        <SelectField
          label="Pendapatan Rata-Rata per Tahun"
          options={pendapatanRangeOptions}
          error={errors.individualDetail?.pendapatanRataRata}
          registration={register("individualDetail.pendapatanRataRata")}
        />
        <FullRow>
          <TextAreaField
            label="Alamat Kantor"
            error={errors.individualDetail?.alamatKantor}
            registration={register("individualDetail.alamatKantor")}
          />
        </FullRow>
        <FullRow>
          <TextField
            label="Tujuan Transaksi"
            error={errors.individualDetail?.tujuanTransaksi}
            registration={register("individualDetail.tujuanTransaksi")}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="C. Informasi Pemilik Manfaat (Beneficial Owner)"
        description="CDD Perorangan — Section 2.C. Opsional, bisa lebih dari satu."
      >
        <FullRow>
          <BeneficialOwnerArrayField<IndividualFormValues>
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
          />
        </FullRow>
      </SectionCard>

      <NotaryServiceFields<IndividualFormValues> register={register} errors={errors} />

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan CDD Perorangan"}
        </button>
      </div>
    </form>
  );
}
