"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CircleAlert, FileText, Search, UserPlus, Wallet } from "lucide-react";
import {
  corporateFormSchema,
  type CorporateFormValues,
  type CorporateFormOutput,
} from "@/lib/validations";
import { createCorporateCustomer } from "@/lib/actions/customer";
import type { DraftDocument } from "@/lib/actions/document";
import type { CorporatePrefill } from "@/lib/actions/duplicateLookup";
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
import { OcrReviewGate } from "@/components/forms/OcrReviewGate";
import { OcrCroppedSnippet } from "@/components/forms/OcrCroppedSnippet";
import {
  OcrFieldProvider,
  useOcrUnverifiedPaths,
} from "@/components/forms/OcrFieldContext";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import { useAutosaveDraft, loadAutosaveDraft, clearAutosaveDraft } from "@/lib/hooks/useAutosaveDraft";
import { DraftRecoveryBanner } from "@/components/forms/DraftRecoveryBanner";
import { applyFieldGuesses } from "@/lib/ocr/applyFieldGuesses";
import { LABEL_MAPS } from "@/lib/ocr/extractFields";
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

const AUTOSAVE_KEY = "notary-aml:draft:corporate";

export function CorporateForm({
  ocrDraft,
  prefill,
}: {
  ocrDraft?: DraftDocument | null;
  prefill?: CorporatePrefill | null;
}) {
  return (
    <OcrFieldProvider guesses={ocrDraft?.fieldGuesses ?? {}}>
      <CorporateFormInner ocrDraft={ocrDraft} prefill={prefill} />
    </OcrFieldProvider>
  );
}

function CorporateFormInner({
  ocrDraft,
  prefill,
}: {
  ocrDraft?: DraftDocument | null;
  prefill?: CorporatePrefill | null;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showOcrGate, setShowOcrGate] = useState(false);
  const [bypassOcrGate, setBypassOcrGate] = useState(false);
  const ocrGate = useOcrUnverifiedPaths();
  const prefilledDefaults: CorporateFormValues = prefill
    ? {
        corporateDetail: { ...defaultValues.corporateDetail, ...prefill.values.corporateDetail },
        beneficialOwners:
          prefill.values.beneficialOwners && prefill.values.beneficialOwners.length > 0
            ? prefill.values.beneficialOwners
            : defaultValues.beneficialOwners,
        powerOfAttorney: { ...defaultValues.powerOfAttorney, ...prefill.values.powerOfAttorney },
        notaryService: { ...defaultValues.notaryService, ...prefill.values.notaryService },
      }
    : defaultValues;
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<CorporateFormValues, unknown, CorporateFormOutput>({
    resolver: zodResolver(corporateFormSchema),
    defaultValues: ocrDraft
      ? applyFieldGuesses(prefilledDefaults, ocrDraft.fieldGuesses)
      : prefilledDefaults,
  });

  useUnsavedChangesWarning(isDirty && !isSubmitSuccessful);

  const allValues = useWatch({ control });
  useAutosaveDraft(AUTOSAVE_KEY, allValues, !isSubmitSuccessful);
  const [draft, setDraft] = useState<{ savedAt: number; values: CorporateFormValues } | null>(null);
  useEffect(() => {
    if (ocrDraft || prefill) return;
    void (async () => {
      setDraft(loadAutosaveDraft<CorporateFormValues>(AUTOSAVE_KEY));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = handleSubmit(async (values: CorporateFormOutput) => {
    setFormError(null);
    clearAutosaveDraft(AUTOSAVE_KEY);
    const result = await createCorporateCustomer(values, ocrDraft?.id, prefill?.sourceLabel);
    // Jika sukses, createCorporateCustomer memanggil redirect() dan tidak pernah sampai ke sini.
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

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (ocrGate && ocrGate.unverifiedPaths.length > 0 && !bypassOcrGate) {
      e.preventDefault();
      setShowOcrGate(true);
      return;
    }
    onSubmit(e);
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-subtle px-4 py-3.5 text-sm font-medium text-red-700"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" strokeWidth={2} />
          {formError}
        </div>
      )}

      {draft && (
        <DraftRecoveryBanner
          savedAt={draft.savedAt}
          onRestore={() => {
            reset(draft.values);
            setDraft(null);
          }}
          onDiscard={() => {
            clearAutosaveDraft(AUTOSAVE_KEY);
            setDraft(null);
          }}
        />
      )}

      {prefill && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-brand-subtle bg-brand-subtle px-4 py-3.5 text-sm text-blue-800"
        >
          <Search className="mt-0.5 h-5 w-5 shrink-0 text-brand-hover" strokeWidth={2} />
          <p>
            Formulir diisi otomatis dari data klien terdaftar sebelumnya:{" "}
            <strong>{prefill.sourceLabel}</strong>. Periksa dan perbarui data
            yang mungkin sudah berubah sebelum menyimpan.
          </p>
        </div>
      )}

      {ocrDraft && <OcrAssistBanner rawText={ocrDraft.rawText} />}

      {showOcrGate && ocrGate && (
        <OcrReviewGate
          labels={ocrGate.unverifiedPaths.map(
            (p) => LABEL_MAPS.KORPORASI[p]?.[0] ?? p
          )}
          onReviewNow={() => {
            setShowOcrGate(false);
            setFocus(ocrGate.unverifiedPaths[0] as never);
          }}
          onConfirmAllAndSave={() => {
            ocrGate.confirmAll();
            setShowOcrGate(false);
            onSubmit();
          }}
          onProceedAnyway={() => {
            setBypassOcrGate(true);
            setShowOcrGate(false);
            onSubmit();
          }}
        />
      )}

      <SectionCard
        title="A. Informasi Dasar Pengguna Jasa"
        description="CDD Korporasi — Section 1.A"
        icon={Building2}
      >
        <div>
          <TextField
            label="Nama Korporasi"
            required
            error={errors.corporateDetail?.namaKorporasi}
            registration={register("corporateDetail.namaKorporasi")}
            ocrPath="corporateDetail.namaKorporasi"
          />
          {ocrDraft && (
            <OcrCroppedSnippet
              documentId={ocrDraft.id}
              bbox={ocrDraft.fieldGuesses["corporateDetail.namaKorporasi"]?.bbox ?? null}
            />
          )}
        </div>
        <TextField
          label="Bentuk Korporasi"
          hint="mis. PT, CV, Yayasan, Koperasi"
          error={errors.corporateDetail?.bentukKorporasi}
          registration={register("corporateDetail.bentukKorporasi")}
          ocrPath="corporateDetail.bentukKorporasi"
        />
        <TextField
          label="No. SK Pengesahan"
          error={errors.corporateDetail?.noSkPengesahan}
          registration={register("corporateDetail.noSkPengesahan")}
          ocrPath="corporateDetail.noSkPengesahan"
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
          ocrPath="corporateDetail.noIjinUsaha"
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
          ocrPath="corporateDetail.npwp"
        />
        <TextField
          label="No. Akta Pendirian / Akta Kepengurusan Terakhir"
          error={errors.corporateDetail?.noAktaPendirian}
          registration={register("corporateDetail.noAktaPendirian")}
          ocrPath="corporateDetail.noAktaPendirian"
        />
        <FullRow>
          <TextAreaField
            label="Alamat Korporasi sesuai Akta"
            error={errors.corporateDetail?.alamatSesuaiAkta}
            registration={register("corporateDetail.alamatSesuaiAkta")}
            ocrPath="corporateDetail.alamatSesuaiAkta"
          />
        </FullRow>
        <FullRow>
          <TextAreaField
            label="Alamat Lokasi Usaha"
            error={errors.corporateDetail?.alamatLokasiUsaha}
            registration={register("corporateDetail.alamatLokasiUsaha")}
            ocrPath="corporateDetail.alamatLokasiUsaha"
          />
        </FullRow>
        <TextField
          label="Nomor Telepon Korporasi"
          error={errors.corporateDetail?.nomorTelepon}
          registration={register("corporateDetail.nomorTelepon")}
          ocrPath="corporateDetail.nomorTelepon"
        />
        <TextField
          label="Nomor Faksimili"
          error={errors.corporateDetail?.nomorFaksimili}
          registration={register("corporateDetail.nomorFaksimili")}
          ocrPath="corporateDetail.nomorFaksimili"
        />
        <TextField
          label="Bidang Usaha"
          hint="Sama dengan Bidang Usaha di Informasi Kekayaan Korporasi (satu field)"
          error={errors.corporateDetail?.bidangUsaha}
          registration={register("corporateDetail.bidangUsaha")}
          ocrPath="corporateDetail.bidangUsaha"
        />
      </SectionCard>

      <SectionCard
        title="B. Informasi Kekayaan Korporasi"
        description="CDD Korporasi — Section 1.B"
        icon={Wallet}
      >
        <TextField
          label="Sumber Dana"
          error={errors.corporateDetail?.sumberDana}
          registration={register("corporateDetail.sumberDana")}
          ocrPath="corporateDetail.sumberDana"
        />
        <TextField
          label="Pendapatan Rata-Rata per Tahun"
          error={errors.corporateDetail?.pendapatanRataRata}
          registration={register("corporateDetail.pendapatanRataRata")}
          ocrPath="corporateDetail.pendapatanRataRata"
        />
        <FullRow>
          <TextField
            label="Tujuan Transaksi"
            error={errors.corporateDetail?.tujuanTransaksi}
            registration={register("corporateDetail.tujuanTransaksi")}
            ocrPath="corporateDetail.tujuanTransaksi"
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="C. Informasi Pemilik Manfaat (Beneficial Owner)"
        description="CDD Korporasi — Section 1.C. Opsional, bisa lebih dari satu."
        icon={UserPlus}
      >
        <FullRow>
          <BeneficialOwnerArrayField<CorporateFormValues>
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="D. Informasi Kuasa Korporasi"
        description="CDD Korporasi — Section 1.D"
        icon={FileText}
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

      <NotaryServiceFields<CorporateFormValues> register={register} errors={errors} />

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary px-5 py-2.5 text-sm shadow-sm"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan CDD Korporasi"}
        </button>
      </div>
    </form>
  );
}
