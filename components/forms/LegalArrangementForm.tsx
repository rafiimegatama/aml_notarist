"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  legalArrangementFormSchema,
  legalArrangementBoRoleValues,
  type LegalArrangementFormValues,
  type LegalArrangementFormOutput,
} from "@/lib/validations";
import { createLegalArrangementCustomer } from "@/lib/actions/customer";
import {
  SectionCard,
  TextField,
  TextAreaField,
  SelectField,
  FullRow,
} from "@/components/forms/fields";
import { BeneficialOwnerArrayField } from "@/components/forms/BeneficialOwnerArrayField";
import { LegalArrangementPartyArrayField } from "@/components/forms/LegalArrangementPartyArrayField";
import { NotaryServiceFields } from "@/components/forms/NotaryServiceFields";
import { jenisIdentitasLabels, labelOptions } from "@/lib/labels";

const jenisIdentitasOptions = labelOptions(jenisIdentitasLabels);

const defaultValues: LegalArrangementFormValues = {
  legalArrangementDetail: {
    nama: "",
    jenisIdentitas: "",
    noIdentitas: "",
    noSkPengesahan: "",
    tanggalSkPengesahan: "",
    noIjinUsaha: "",
    tanggalIjinUsaha: "",
    npwp: "",
    alamat: "",
    nomorTelepon: "",
    nomorFaksimili: "",
    bidangUsaha: "",
    noAktaPendirian: "",
    sumberDana: "",
    pendapatanRataRata: "",
    tujuanTransaksi: "",
  },
  beneficialOwners: [],
  parties: [],
  notaryService: {
    namaNotaris: "",
    jasaYangDiberikan: "",
  },
};

export function LegalArrangementForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<
    LegalArrangementFormValues,
    unknown,
    LegalArrangementFormOutput
  >({
    resolver: zodResolver(legalArrangementFormSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values: LegalArrangementFormOutput) => {
    setFormError(null);
    setSubmitting(true);
    const result = await createLegalArrangementCustomer(values);
    setSubmitting(false);
    if (!result.success) {
      setFormError(
        result.formError ?? "Periksa kembali isian yang bertanda merah."
      );
      for (const [path, message] of Object.entries(result.fieldErrors)) {
        setError(path as never, { message });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <SectionCard
        title="A. Informasi Dasar Pengguna Jasa"
        description="CDD Perikatan Lainnya — Section 3.A"
      >
        <TextField
          label="Nama"
          required
          error={errors.legalArrangementDetail?.nama}
          registration={register("legalArrangementDetail.nama")}
        />
        <SelectField
          label="Jenis Identitas"
          options={jenisIdentitasOptions}
          error={errors.legalArrangementDetail?.jenisIdentitas}
          registration={register("legalArrangementDetail.jenisIdentitas")}
        />
        <TextField
          label="No. Identitas"
          error={errors.legalArrangementDetail?.noIdentitas}
          registration={register("legalArrangementDetail.noIdentitas")}
        />
        <TextField
          label="No. SK Pengesahan"
          hint="isi jika Korporasi"
          error={errors.legalArrangementDetail?.noSkPengesahan}
          registration={register("legalArrangementDetail.noSkPengesahan")}
        />
        <TextField
          label="Tanggal SK Pengesahan"
          type="date"
          error={errors.legalArrangementDetail?.tanggalSkPengesahan}
          registration={register(
            "legalArrangementDetail.tanggalSkPengesahan"
          )}
        />
        <TextField
          label="No. Ijin Usaha"
          hint="isi jika Korporasi"
          error={errors.legalArrangementDetail?.noIjinUsaha}
          registration={register("legalArrangementDetail.noIjinUsaha")}
        />
        <TextField
          label="Tanggal Ijin Usaha"
          type="date"
          error={errors.legalArrangementDetail?.tanggalIjinUsaha}
          registration={register("legalArrangementDetail.tanggalIjinUsaha")}
        />
        <TextField
          label="NPWP"
          error={errors.legalArrangementDetail?.npwp}
          registration={register("legalArrangementDetail.npwp")}
        />
        <TextField
          label="Nomor Telepon"
          error={errors.legalArrangementDetail?.nomorTelepon}
          registration={register("legalArrangementDetail.nomorTelepon")}
        />
        <TextField
          label="Nomor Faksimili"
          error={errors.legalArrangementDetail?.nomorFaksimili}
          registration={register("legalArrangementDetail.nomorFaksimili")}
        />
        <TextField
          label="Bidang Usaha"
          hint="isi jika Korporasi. Sama dengan Bidang Usaha di Informasi Kekayaan (satu field)"
          error={errors.legalArrangementDetail?.bidangUsaha}
          registration={register("legalArrangementDetail.bidangUsaha")}
        />
        <TextField
          label="No. Akta Pendirian / Akta Kepengurusan Terakhir"
          hint="isi jika Korporasi"
          error={errors.legalArrangementDetail?.noAktaPendirian}
          registration={register("legalArrangementDetail.noAktaPendirian")}
        />
        <FullRow>
          <TextAreaField
            label="Alamat"
            error={errors.legalArrangementDetail?.alamat}
            registration={register("legalArrangementDetail.alamat")}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="B. Informasi Kekayaan"
        description="CDD Perikatan Lainnya — Section 3.B"
      >
        <TextField
          label="Sumber Dana"
          error={errors.legalArrangementDetail?.sumberDana}
          registration={register("legalArrangementDetail.sumberDana")}
        />
        <TextField
          label="Pendapatan Rata-Rata per Tahun"
          error={errors.legalArrangementDetail?.pendapatanRataRata}
          registration={register(
            "legalArrangementDetail.pendapatanRataRata"
          )}
        />
        <FullRow>
          <TextField
            label="Tujuan Transaksi"
            error={errors.legalArrangementDetail?.tujuanTransaksi}
            registration={register("legalArrangementDetail.tujuanTransaksi")}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="C. Informasi Pemilik Manfaat (Beneficial Owner)"
        description="CDD Perikatan Lainnya — Section 3.C. Opsional, bisa lebih dari satu."
      >
        <FullRow>
          <BeneficialOwnerArrayField<LegalArrangementFormValues>
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            roleQuickSelect={legalArrangementBoRoleValues}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="D. Informasi Pihak dalam Legal Arrangement"
        description="CDD Perikatan Lainnya — Section 3.D"
      >
        <FullRow>
          <LegalArrangementPartyArrayField<LegalArrangementFormValues>
            control={control}
            register={register}
            errors={errors}
          />
        </FullRow>
      </SectionCard>

      <NotaryServiceFields<LegalArrangementFormValues> register={register} errors={errors} />

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan CDD Perikatan Lainnya"}
        </button>
      </div>
    </form>
  );
}
