"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  corporateFormSchema,
  type CorporateFormValues,
  type CorporateFormOutput,
} from "@/lib/validations";
import { createCorporateCustomer } from "@/lib/actions/customer";
import {
  SectionCard,
  TextField,
  TextAreaField,
  SelectField,
  FullRow,
} from "@/components/forms/fields";
import { BeneficialOwnerArrayField } from "@/components/forms/BeneficialOwnerArrayField";
import { NotaryServiceFields } from "@/components/forms/NotaryServiceFields";
import {
  jenisIdentitasLabels,
  hubunganHukumPengurusLabels,
  labelOptions,
} from "@/lib/labels";

const jenisIdentitasOptions = labelOptions(jenisIdentitasLabels);
const hubunganHukumOptions = labelOptions(hubunganHukumPengurusLabels);

const defaultValues: CorporateFormValues = {
  corporateDetail: {
    namaKorporasi: "",
    bentukKorporasi: "",
    noSkPengesahan: "",
    tanggalSkPengesahan: "",
    noIjinUsaha: "",
    tanggalIjinUsaha: "",
    npwp: "",
    alamatSesuaiAkta: "",
    alamatLokasiUsaha: "",
    nomorTelepon: "",
    nomorFaksimili: "",
    bidangUsaha: "",
    noAktaPendirian: "",
    sumberDana: "",
    pendapatanRataRata: "",
    tujuanTransaksi: "",
  },
  beneficialOwners: [],
  powerOfAttorney: {
    hubunganHukum: "",
    noSuratKuasa: "",
    tanggalSuratKuasa: "",
    penandatanganSuratKuasa: "",
    jabatanPenandatangan: "",
    namaLengkapPenggunaJasa: "",
    namaAlias: "",
    jenisIdentitasPenggunaJasa: "",
    noIdentitasPenggunaJasa: "",
    tempatLahir: "",
    tanggalLahir: "",
    kewarganegaraan: "",
    alamatTempatTinggal: "",
  },
  notaryService: {
    namaNotaris: "",
    jasaYangDiberikan: "",
  },
};

export function CorporateForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CorporateFormValues, unknown, CorporateFormOutput>({
    resolver: zodResolver(corporateFormSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values: CorporateFormOutput) => {
    setFormError(null);
    setSubmitting(true);
    const result = await createCorporateCustomer(values);
    // Jika sukses, createCorporateCustomer memanggil redirect() dan tidak pernah sampai ke sini.
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
        description="CDD Korporasi — Section 1.A"
      >
        <TextField
          label="Nama Korporasi"
          required
          error={errors.corporateDetail?.namaKorporasi}
          registration={register("corporateDetail.namaKorporasi")}
        />
        <TextField
          label="Bentuk Korporasi"
          hint="mis. PT, CV, Yayasan, Koperasi"
          error={errors.corporateDetail?.bentukKorporasi}
          registration={register("corporateDetail.bentukKorporasi")}
        />
        <TextField
          label="No. SK Pengesahan"
          error={errors.corporateDetail?.noSkPengesahan}
          registration={register("corporateDetail.noSkPengesahan")}
        />
        <TextField
          label="Tanggal SK Pengesahan"
          type="date"
          error={errors.corporateDetail?.tanggalSkPengesahan}
          registration={register("corporateDetail.tanggalSkPengesahan")}
        />
        <TextField
          label="No. Ijin Usaha"
          error={errors.corporateDetail?.noIjinUsaha}
          registration={register("corporateDetail.noIjinUsaha")}
        />
        <TextField
          label="Tanggal Ijin Usaha"
          type="date"
          error={errors.corporateDetail?.tanggalIjinUsaha}
          registration={register("corporateDetail.tanggalIjinUsaha")}
        />
        <TextField
          label="NPWP"
          error={errors.corporateDetail?.npwp}
          registration={register("corporateDetail.npwp")}
        />
        <TextField
          label="No. Akta Pendirian / Akta Kepengurusan Terakhir"
          error={errors.corporateDetail?.noAktaPendirian}
          registration={register("corporateDetail.noAktaPendirian")}
        />
        <FullRow>
          <TextAreaField
            label="Alamat Korporasi sesuai Akta"
            error={errors.corporateDetail?.alamatSesuaiAkta}
            registration={register("corporateDetail.alamatSesuaiAkta")}
          />
        </FullRow>
        <FullRow>
          <TextAreaField
            label="Alamat Lokasi Usaha"
            error={errors.corporateDetail?.alamatLokasiUsaha}
            registration={register("corporateDetail.alamatLokasiUsaha")}
          />
        </FullRow>
        <TextField
          label="Nomor Telepon Korporasi"
          error={errors.corporateDetail?.nomorTelepon}
          registration={register("corporateDetail.nomorTelepon")}
        />
        <TextField
          label="Nomor Faksimili"
          error={errors.corporateDetail?.nomorFaksimili}
          registration={register("corporateDetail.nomorFaksimili")}
        />
        <TextField
          label="Bidang Usaha"
          hint="Sama dengan Bidang Usaha di Informasi Kekayaan Korporasi (satu field)"
          error={errors.corporateDetail?.bidangUsaha}
          registration={register("corporateDetail.bidangUsaha")}
        />
      </SectionCard>

      <SectionCard
        title="B. Informasi Kekayaan Korporasi"
        description="CDD Korporasi — Section 1.B"
      >
        <TextField
          label="Sumber Dana"
          error={errors.corporateDetail?.sumberDana}
          registration={register("corporateDetail.sumberDana")}
        />
        <TextField
          label="Pendapatan Rata-Rata per Tahun"
          error={errors.corporateDetail?.pendapatanRataRata}
          registration={register("corporateDetail.pendapatanRataRata")}
        />
        <FullRow>
          <TextField
            label="Tujuan Transaksi"
            error={errors.corporateDetail?.tujuanTransaksi}
            registration={register("corporateDetail.tujuanTransaksi")}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="C. Informasi Pemilik Manfaat (Beneficial Owner)"
        description="CDD Korporasi — Section 1.C. Opsional, bisa lebih dari satu."
      >
        <FullRow>
          <BeneficialOwnerArrayField
            control={control as never}
            register={register}
            setValue={setValue}
            errors={errors}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="D. Informasi Kuasa Korporasi"
        description="CDD Korporasi — Section 1.D"
      >
        <SelectField
          label="Hubungan Hukum Pengguna Jasa"
          required
          options={hubunganHukumOptions}
          error={errors.powerOfAttorney?.hubunganHukum}
          registration={register("powerOfAttorney.hubunganHukum")}
        />
        <TextField
          label="No. Surat Kuasa"
          error={errors.powerOfAttorney?.noSuratKuasa}
          registration={register("powerOfAttorney.noSuratKuasa")}
        />
        <TextField
          label="Tanggal Surat Kuasa"
          type="date"
          error={errors.powerOfAttorney?.tanggalSuratKuasa}
          registration={register("powerOfAttorney.tanggalSuratKuasa")}
        />
        <TextField
          label="Penandatangan Surat Kuasa"
          error={errors.powerOfAttorney?.penandatanganSuratKuasa}
          registration={register("powerOfAttorney.penandatanganSuratKuasa")}
        />
        <TextField
          label="Jabatan Penandatangan"
          error={errors.powerOfAttorney?.jabatanPenandatangan}
          registration={register("powerOfAttorney.jabatanPenandatangan")}
        />
        <TextField
          label="Nama Lengkap Pengguna Jasa"
          error={errors.powerOfAttorney?.namaLengkapPenggunaJasa}
          registration={register("powerOfAttorney.namaLengkapPenggunaJasa")}
        />
        <TextField
          label="Nama Alias"
          error={errors.powerOfAttorney?.namaAlias}
          registration={register("powerOfAttorney.namaAlias")}
        />
        <SelectField
          label="Jenis Identitas Pengguna Jasa"
          options={jenisIdentitasOptions}
          error={errors.powerOfAttorney?.jenisIdentitasPenggunaJasa}
          registration={register(
            "powerOfAttorney.jenisIdentitasPenggunaJasa"
          )}
        />
        <TextField
          label="No. Identitas Pengguna Jasa"
          error={errors.powerOfAttorney?.noIdentitasPenggunaJasa}
          registration={register("powerOfAttorney.noIdentitasPenggunaJasa")}
        />
        <TextField
          label="Tempat Lahir"
          error={errors.powerOfAttorney?.tempatLahir}
          registration={register("powerOfAttorney.tempatLahir")}
        />
        <TextField
          label="Tanggal Lahir"
          type="date"
          error={errors.powerOfAttorney?.tanggalLahir}
          registration={register("powerOfAttorney.tanggalLahir")}
        />
        <TextField
          label="Kewarganegaraan"
          error={errors.powerOfAttorney?.kewarganegaraan}
          registration={register("powerOfAttorney.kewarganegaraan")}
        />
        <FullRow>
          <TextAreaField
            label="Alamat Tempat Tinggal"
            error={errors.powerOfAttorney?.alamatTempatTinggal}
            registration={register("powerOfAttorney.alamatTempatTinggal")}
          />
        </FullRow>
      </SectionCard>

      <NotaryServiceFields register={register} errors={errors} />

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan CDD Korporasi"}
        </button>
      </div>
    </form>
  );
}
