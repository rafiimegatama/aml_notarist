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
import type { DraftDocument } from "@/lib/actions/document";
import type { LegalArrangementPrefill } from "@/lib/actions/duplicateLookup";
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
import { OcrAssistBanner } from "@/components/forms/OcrAssistBanner";
import { OcrReviewGate } from "@/components/forms/OcrReviewGate";
import { OcrCroppedSnippet } from "@/components/forms/OcrCroppedSnippet";
import {
  OcrFieldProvider,
  useOcrUnverifiedPaths,
} from "@/components/forms/OcrFieldContext";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import { applyFieldGuesses } from "@/lib/ocr/applyFieldGuesses";
import { LABEL_MAPS } from "@/lib/ocr/extractFields";
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

export function LegalArrangementForm({
  ocrDraft,
  prefill,
}: {
  ocrDraft?: DraftDocument | null;
  prefill?: LegalArrangementPrefill | null;
}) {
  return (
    <OcrFieldProvider guesses={ocrDraft?.fieldGuesses ?? {}}>
      <LegalArrangementFormInner ocrDraft={ocrDraft} prefill={prefill} />
    </OcrFieldProvider>
  );
}

function LegalArrangementFormInner({
  ocrDraft,
  prefill,
}: {
  ocrDraft?: DraftDocument | null;
  prefill?: LegalArrangementPrefill | null;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showOcrGate, setShowOcrGate] = useState(false);
  const [bypassOcrGate, setBypassOcrGate] = useState(false);
  const ocrGate = useOcrUnverifiedPaths();
  const prefilledDefaults: LegalArrangementFormValues = prefill
    ? {
        legalArrangementDetail: {
          ...defaultValues.legalArrangementDetail,
          ...prefill.values.legalArrangementDetail,
        },
        beneficialOwners:
          prefill.values.beneficialOwners && prefill.values.beneficialOwners.length > 0
            ? prefill.values.beneficialOwners
            : defaultValues.beneficialOwners,
        parties:
          prefill.values.parties && prefill.values.parties.length > 0
            ? prefill.values.parties
            : defaultValues.parties,
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
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<
    LegalArrangementFormValues,
    unknown,
    LegalArrangementFormOutput
  >({
    resolver: zodResolver(legalArrangementFormSchema),
    defaultValues: ocrDraft
      ? applyFieldGuesses(prefilledDefaults, ocrDraft.fieldGuesses)
      : prefilledDefaults,
  });

  useUnsavedChangesWarning(isDirty && !isSubmitSuccessful);

  const onSubmit = handleSubmit(async (values: LegalArrangementFormOutput) => {
    setFormError(null);
    const result = await createLegalArrangementCustomer(values, ocrDraft?.id, prefill?.sourceLabel);
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
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      {prefill && (
        <div
          role="status"
          className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
        >
          Formulir diisi otomatis dari data klien terdaftar sebelumnya:{" "}
          <strong>{prefill.sourceLabel}</strong>. Periksa dan perbarui data
          yang mungkin sudah berubah sebelum menyimpan.
        </div>
      )}

      {ocrDraft && <OcrAssistBanner rawText={ocrDraft.rawText} />}

      {showOcrGate && ocrGate && (
        <OcrReviewGate
          labels={ocrGate.unverifiedPaths.map(
            (p) => LABEL_MAPS.LEGAL_ARRANGEMENT[p]?.[0] ?? p
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
        <div>
          <TextField
            label="No. Identitas"
            error={errors.legalArrangementDetail?.noIdentitas}
            registration={register("legalArrangementDetail.noIdentitas")}
            ocrPath="legalArrangementDetail.noIdentitas"
          />
          {ocrDraft && (
            <OcrCroppedSnippet
              documentId={ocrDraft.id}
              bbox={ocrDraft.fieldGuesses["legalArrangementDetail.noIdentitas"]?.bbox ?? null}
            />
          )}
        </div>
        <TextField
          label="No. SK Pengesahan"
          hint="isi jika Korporasi"
          error={errors.legalArrangementDetail?.noSkPengesahan}
          registration={register("legalArrangementDetail.noSkPengesahan")}
          ocrPath="legalArrangementDetail.noSkPengesahan"
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
          ocrPath="legalArrangementDetail.noIjinUsaha"
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
          ocrPath="legalArrangementDetail.npwp"
        />
        <TextField
          label="Nomor Telepon"
          error={errors.legalArrangementDetail?.nomorTelepon}
          registration={register("legalArrangementDetail.nomorTelepon")}
          ocrPath="legalArrangementDetail.nomorTelepon"
        />
        <TextField
          label="Nomor Faksimili"
          error={errors.legalArrangementDetail?.nomorFaksimili}
          registration={register("legalArrangementDetail.nomorFaksimili")}
          ocrPath="legalArrangementDetail.nomorFaksimili"
        />
        <TextField
          label="Bidang Usaha"
          hint="isi jika Korporasi. Sama dengan Bidang Usaha di Informasi Kekayaan (satu field)"
          error={errors.legalArrangementDetail?.bidangUsaha}
          registration={register("legalArrangementDetail.bidangUsaha")}
          ocrPath="legalArrangementDetail.bidangUsaha"
        />
        <TextField
          label="No. Akta Pendirian / Akta Kepengurusan Terakhir"
          hint="isi jika Korporasi"
          error={errors.legalArrangementDetail?.noAktaPendirian}
          registration={register("legalArrangementDetail.noAktaPendirian")}
          ocrPath="legalArrangementDetail.noAktaPendirian"
        />
        <FullRow>
          <TextAreaField
            label="Alamat"
            error={errors.legalArrangementDetail?.alamat}
            registration={register("legalArrangementDetail.alamat")}
            ocrPath="legalArrangementDetail.alamat"
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
          ocrPath="legalArrangementDetail.sumberDana"
        />
        <TextField
          label="Pendapatan Rata-Rata per Tahun"
          error={errors.legalArrangementDetail?.pendapatanRataRata}
          registration={register(
            "legalArrangementDetail.pendapatanRataRata"
          )}
          ocrPath="legalArrangementDetail.pendapatanRataRata"
        />
        <FullRow>
          <TextField
            label="Tujuan Transaksi"
            error={errors.legalArrangementDetail?.tujuanTransaksi}
            registration={register("legalArrangementDetail.tujuanTransaksi")}
            ocrPath="legalArrangementDetail.tujuanTransaksi"
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
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan CDD Perikatan Lainnya"}
        </button>
      </div>
    </form>
  );
}
