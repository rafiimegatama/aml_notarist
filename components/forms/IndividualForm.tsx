"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, CircleAlert, Search, User, UserPlus } from "lucide-react";
import {
  individualFormSchema,
  type IndividualFormValues,
  type IndividualFormOutput,
} from "@/lib/validations";
import { createIndividualCustomer } from "@/lib/actions/customer";
import type { DraftDocument } from "@/lib/actions/document";
import type { IndividualPrefill } from "@/lib/actions/duplicateLookup";
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

const AUTOSAVE_KEY = "notary-aml:draft:individual";

export function IndividualForm({
  ocrDraft,
  prefill,
}: {
  ocrDraft?: DraftDocument | null;
  prefill?: IndividualPrefill | null;
}) {
  return (
    <OcrFieldProvider guesses={ocrDraft?.fieldGuesses ?? {}}>
      <IndividualFormInner ocrDraft={ocrDraft} prefill={prefill} />
    </OcrFieldProvider>
  );
}

function IndividualFormInner({
  ocrDraft,
  prefill,
}: {
  ocrDraft?: DraftDocument | null;
  prefill?: IndividualPrefill | null;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showOcrGate, setShowOcrGate] = useState(false);
  const [bypassOcrGate, setBypassOcrGate] = useState(false);
  const ocrGate = useOcrUnverifiedPaths();
  const prefilledDefaults: IndividualFormValues = prefill
    ? {
        individualDetail: { ...defaultValues.individualDetail, ...prefill.values.individualDetail },
        beneficialOwners:
          prefill.values.beneficialOwners && prefill.values.beneficialOwners.length > 0
            ? prefill.values.beneficialOwners
            : defaultValues.beneficialOwners,
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
  } = useForm<IndividualFormValues, unknown, IndividualFormOutput>({
    resolver: zodResolver(individualFormSchema),
    defaultValues: ocrDraft
      ? applyFieldGuesses(prefilledDefaults, ocrDraft.fieldGuesses)
      : prefilledDefaults,
  });

  useUnsavedChangesWarning(isDirty && !isSubmitSuccessful);

  // Auto-save draft ke localStorage supaya isian tidak hilang kalau tab
  // tertutup/refresh tidak sengaja — hanya ditawarkan untuk dipulihkan kalau
  // TIDAK ada ocrDraft/prefill aktif (dua sumber itu sudah jadi starting
  // point eksplisit dari aksi pengguna, draft lokal tidak boleh menimpanya).
  const allValues = useWatch({ control });
  useAutosaveDraft(AUTOSAVE_KEY, allValues, !isSubmitSuccessful);
  const [draft, setDraft] = useState<{ savedAt: number; values: IndividualFormValues } | null>(null);
  useEffect(() => {
    if (ocrDraft || prefill) return;
    void (async () => {
      setDraft(loadAutosaveDraft<IndividualFormValues>(AUTOSAVE_KEY));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    clearAutosaveDraft(AUTOSAVE_KEY);
    const result = await createIndividualCustomer(values, ocrDraft?.id, prefill?.sourceLabel);
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

  // FR-3 (Must) — pre-submit review gate: interupsi submit pertama kalau
  // masih ada field "Suggested — unverified", tapi dismissable (lihat
  // OcrReviewGate) — bukan hard block.
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
            (p) => LABEL_MAPS.PERORANGAN[p]?.[0] ?? p
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
        description="CDD Perorangan — Section 2.A"
        icon={User}
      >
        <div>
          <TextField
            label="Nama Lengkap"
            required
            error={errors.individualDetail?.namaLengkap}
            registration={register("individualDetail.namaLengkap")}
            ocrPath="individualDetail.namaLengkap"
          />
          {ocrDraft && (
            <OcrCroppedSnippet
              documentId={ocrDraft.id}
              bbox={ocrDraft.fieldGuesses["individualDetail.namaLengkap"]?.bbox ?? null}
            />
          )}
        </div>
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
        <div>
          <TextField
            label="No. Identitas"
            error={errors.individualDetail?.noIdentitas}
            registration={register("individualDetail.noIdentitas")}
            ocrPath="individualDetail.noIdentitas"
          />
          {ocrDraft && (
            <OcrCroppedSnippet
              documentId={ocrDraft.id}
              bbox={ocrDraft.fieldGuesses["individualDetail.noIdentitas"]?.bbox ?? null}
            />
          )}
        </div>
        <TextField
          label="NPWP"
          error={errors.individualDetail?.npwp}
          registration={register("individualDetail.npwp")}
          ocrPath="individualDetail.npwp"
        />
        <TextField
          label="Tempat Lahir"
          error={errors.individualDetail?.tempatLahir}
          registration={register("individualDetail.tempatLahir")}
          ocrPath="individualDetail.tempatLahir"
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
          ocrPath="individualDetail.kewarganegaraan"
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
            ocrPath="individualDetail.alamatTempatTinggal"
          />
        </FullRow>
        <FullRow>
          <TextAreaField
            label="Alamat Domisili"
            error={errors.individualDetail?.alamatDomisili}
            registration={register("individualDetail.alamatDomisili")}
            ocrPath="individualDetail.alamatDomisili"
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
          ocrPath="individualDetail.nomorTeleponRumah"
        />
        <TextField
          label="Nomor HP"
          error={errors.individualDetail?.nomorHp}
          registration={register("individualDetail.nomorHp")}
          ocrPath="individualDetail.nomorHp"
        />
      </SectionCard>

      <SectionCard
        title="B. Informasi Pekerjaan dan Sumber Pendapatan"
        description="CDD Perorangan — Section 2.B"
        icon={Briefcase}
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
          ocrPath="individualDetail.bidangUsaha"
        />
        <TextField
          label="Nama Kantor"
          error={errors.individualDetail?.namaKantor}
          registration={register("individualDetail.namaKantor")}
          ocrPath="individualDetail.namaKantor"
        />
        <TextField
          label="Nomor Telepon Kantor"
          error={errors.individualDetail?.nomorTeleponKantor}
          registration={register("individualDetail.nomorTeleponKantor")}
          ocrPath="individualDetail.nomorTeleponKantor"
        />
        <TextField
          label="Jabatan"
          error={errors.individualDetail?.jabatan}
          registration={register("individualDetail.jabatan")}
          ocrPath="individualDetail.jabatan"
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
            ocrPath="individualDetail.alamatKantor"
          />
        </FullRow>
        <FullRow>
          <TextField
            label="Tujuan Transaksi"
            error={errors.individualDetail?.tujuanTransaksi}
            registration={register("individualDetail.tujuanTransaksi")}
            ocrPath="individualDetail.tujuanTransaksi"
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="C. Informasi Pemilik Manfaat (Beneficial Owner)"
        description="CDD Perorangan — Section 2.C. Opsional, bisa lebih dari satu."
        icon={UserPlus}
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
          className="btn btn-primary px-5 py-2.5 text-sm shadow-sm"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan CDD Perorangan"}
        </button>
      </div>
    </form>
  );
}
