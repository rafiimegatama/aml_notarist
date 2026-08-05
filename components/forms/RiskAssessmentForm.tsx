"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  riskAssessmentSchema,
  type RiskAssessmentValues,
  type RiskAssessmentOutput,
} from "@/lib/validations";
import { saveRiskAssessment } from "@/lib/actions/riskAssessment";
import { computeRiskCategory } from "@/lib/scoring";
import {
  SectionCard,
  TextField,
  SelectField,
  RadioGroupField,
  FullRow,
} from "@/components/forms/fields";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import {
  pepAsalNegaraLabels,
  pepJabatanLabels,
  pepHubunganLabels,
  riskCategoryLabels,
  labelOptions,
} from "@/lib/labels";

const pepAsalNegaraOptions = labelOptions(pepAsalNegaraLabels);
const pepJabatanOptions = labelOptions(pepJabatanLabels);
const pepHubunganOptions = labelOptions(pepHubunganLabels);
const yaTidakOptions = [
  { value: "YA", label: "Ya" },
  { value: "TIDAK", label: "Tidak" },
];

export type RefScoreOption = { id: string; categoryName: string; score: number | null };

export function RiskAssessmentForm({
  customerId,
  initialValues,
  userProfileOptions,
  businessSectorOptions,
  regionOptions,
  countryOptions,
  notaryServiceTypeOptions,
}: {
  customerId: string;
  initialValues: RiskAssessmentValues;
  userProfileOptions: RefScoreOption[];
  businessSectorOptions: RefScoreOption[];
  regionOptions: RefScoreOption[];
  countryOptions: RefScoreOption[];
  notaryServiceTypeOptions: RefScoreOption[];
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<RiskAssessmentValues, unknown, RiskAssessmentOutput>({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(isDirty && !isSubmitSuccessful);

  const isPep = useWatch({ control, name: "isPep" });
  const [
    userProfileScoreId,
    businessSectorScoreId,
    regionScoreId,
    countryScoreId,
    notaryServiceTypeScoreId,
  ] = useWatch({
    control,
    name: [
      "userProfileScoreId",
      "businessSectorScoreId",
      "regionScoreId",
      "countryScoreId",
      "notaryServiceTypeScoreId",
    ],
  });

  const scoreMaps = useMemo(() => {
    const toMap = (opts: RefScoreOption[]) =>
      new Map(opts.map((o) => [o.id, o.score]));
    return {
      userProfile: toMap(userProfileOptions),
      businessSector: toMap(businessSectorOptions),
      region: toMap(regionOptions),
      country: toMap(countryOptions),
      notaryServiceType: toMap(notaryServiceTypeOptions),
    };
  }, [
    userProfileOptions,
    businessSectorOptions,
    regionOptions,
    countryOptions,
    notaryServiceTypeOptions,
  ]);

  const selectedScores = [
    scoreMaps.userProfile.get(userProfileScoreId ?? ""),
    scoreMaps.businessSector.get(businessSectorScoreId ?? ""),
    scoreMaps.region.get(regionScoreId ?? ""),
    scoreMaps.country.get(countryScoreId ?? ""),
    scoreMaps.notaryServiceType.get(notaryServiceTypeScoreId ?? ""),
  ];
  const allSelected = selectedScores.every((s) => typeof s === "number");
  const runningTotal = selectedScores.reduce(
    (sum: number, s) => sum + (typeof s === "number" ? s : 0),
    0
  );
  const previewCategory = allSelected
    ? computeRiskCategory(runningTotal)
    : null;

  const businessSectorEmpty = businessSectorOptions.length === 0;

  const onSubmit = handleSubmit(async (values: RiskAssessmentOutput) => {
    setFormError(null);
    const result = await saveRiskAssessment(customerId, values);
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

      <SectionCard
        title="Analisa PEP (Politically Exposed Person)"
        description="Risk Assessment — Section 4"
      >
        <RadioGroupField
          label="Apakah Pengguna Jasa adalah PEP?"
          options={yaTidakOptions}
          error={errors.isPep as never}
          registration={register("isPep")}
        />
        {isPep === "YA" && (
          <TextField
            label="Nama Lengkap PEP"
            error={errors.namaLengkapPep}
            registration={register("namaLengkapPep")}
          />
        )}
        <SelectField
          label="PEP Lokal atau Asing"
          options={pepAsalNegaraOptions}
          error={errors.pepAsalNegara}
          registration={register("pepAsalNegara")}
        />
        <TextField
          label="Warga Negara PEP"
          error={errors.wargaNegaraPep}
          registration={register("wargaNegaraPep")}
        />
        <RadioGroupField
          label="Apakah terdapat berita negatif terkait PEP"
          options={yaTidakOptions}
          error={errors.adaBeritaNegatif as never}
          registration={register("adaBeritaNegatif")}
        />
        <SelectField
          label="Jabatan PEP"
          options={pepJabatanOptions}
          error={errors.jabatanPep}
          registration={register("jabatanPep")}
        />
        <FullRow>
          <SelectField
            label="Hubungan Pengguna Jasa dengan PEP"
            options={pepHubunganOptions}
            error={errors.hubunganDenganPep}
            registration={register("hubunganDenganPep")}
          />
        </FullRow>
      </SectionCard>

      <SectionCard
        title="Skoring Risiko"
        description="Risk Assessment — Section 5/6. Pilih kelima kategori untuk menghitung Total Nilai."
      >
        <SelectField
          label="Profil Pengguna Jasa dan/atau BO"
          options={userProfileOptions.map((o) => ({
            value: o.id,
            label: `${o.categoryName} (${o.score})`,
          }))}
          error={errors.userProfileScoreId}
          registration={register("userProfileScoreId")}
        />
        <div>
          <SelectField
            label="Profil Bisnis Pengguna Jasa dan/atau BO"
            options={businessSectorOptions.map((o) => ({
              value: o.id,
              label:
                o.score != null
                  ? `${o.categoryName} (${o.score})`
                  : o.categoryName,
            }))}
            error={errors.businessSectorScoreId}
            registration={register("businessSectorScoreId")}
            disabled={businessSectorEmpty}
          />
          {businessSectorEmpty && (
            <p className="mt-1 text-sm font-medium text-amber-700">
              Skor Bisnis belum tersedia — Total Nilai belum final. Lengkapi
              di halaman Referensi Data.
            </p>
          )}
        </div>
        <SelectField
          label="Profil Wilayah Pengguna Jasa dan/atau BO"
          options={regionOptions.map((o) => ({
            value: o.id,
            label: `${o.categoryName} (${o.score})`,
          }))}
          error={errors.regionScoreId}
          registration={register("regionScoreId")}
        />
        <SelectField
          label="Profil Negara Asal Pengguna Jasa dan/atau BO"
          options={countryOptions.map((o) => ({
            value: o.id,
            label: `${o.categoryName} (${o.score})`,
          }))}
          error={errors.countryScoreId}
          registration={register("countryScoreId")}
        />
        <FullRow>
          <SelectField
            label="Profil Jasa yang Diberikan oleh Notaris"
            options={notaryServiceTypeOptions.map((o) => ({
              value: o.id,
              label: `${o.categoryName} (${o.score})`,
            }))}
            error={errors.notaryServiceTypeScoreId}
            registration={register("notaryServiceTypeScoreId")}
          />
        </FullRow>

        <FullRow>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Total Nilai {!allSelected && "(sementara)"}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {runningTotal}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Kategori Risiko
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {previewCategory
                  ? riskCategoryLabels[previewCategory]
                  : "Belum final"}
              </span>
            </div>
            {!allSelected && (
              <p className="mt-2 text-xs text-gray-500">
                Pilih kelima kategori di atas agar Total Nilai dianggap
                final.
              </p>
            )}
            {previewCategory === "TINGGI" && (
              <p className="mt-2 text-sm font-medium text-red-700">
                Kategori Tinggi — Informasi Tambahan (EDD) wajib diisi
                sebelum CDD ini dianggap lengkap.
              </p>
            )}
          </div>
        </FullRow>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary px-5 py-2.5 text-sm shadow-sm"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Risk Assessment"}
        </button>
      </div>
    </form>
  );
}
