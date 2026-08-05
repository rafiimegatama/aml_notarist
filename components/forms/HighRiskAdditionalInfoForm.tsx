"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  highRiskAdditionalInfoSchema,
  type HighRiskAdditionalInfoValues,
  type HighRiskAdditionalInfoOutput,
} from "@/lib/validations";
import { saveHighRiskAdditionalInfo } from "@/lib/actions/highRiskInfo";
import {
  SectionCard,
  TextField,
  TextAreaField,
  SelectField,
  FullRow,
} from "@/components/forms/fields";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import {
  jenisIdentitasEddLabels,
  jenisHighRiskCustomerLabels,
  tujuanTransaksiEddLabels,
  sumberKekayaanEddLabels,
  penghasilanBulananEddLabels,
  labelOptions,
} from "@/lib/labels";

const jenisIdentitasOptions = labelOptions(jenisIdentitasEddLabels);
const jenisHighRiskCustomerOptions = labelOptions(jenisHighRiskCustomerLabels);
const tujuanTransaksiOptions = labelOptions(tujuanTransaksiEddLabels);
const sumberKekayaanOptions = labelOptions(sumberKekayaanEddLabels);
const penghasilanOptions = labelOptions(penghasilanBulananEddLabels);

export function HighRiskAdditionalInfoForm({
  customerId,
  initialValues,
}: {
  customerId: string;
  initialValues: HighRiskAdditionalInfoValues;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<HighRiskAdditionalInfoValues, unknown, HighRiskAdditionalInfoOutput>({
    resolver: zodResolver(highRiskAdditionalInfoSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(isDirty && !isSubmitSuccessful);

  const tujuanTransaksi = useWatch({ control, name: "tujuanTransaksi" });
  const sumberKekayaan = useWatch({ control, name: "sumberKekayaan" });

  const onSubmit = handleSubmit(async (values: HighRiskAdditionalInfoOutput) => {
    setFormError(null);
    const result = await saveHighRiskAdditionalInfo(customerId, values);
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
        title="A. Perorangan/Pribadi"
        description="Informasi Tambahan — Section 7.A"
      >
        <TextField
          label="Nama Lengkap"
          error={errors.namaLengkap}
          registration={register("namaLengkap")}
        />
        <SelectField
          label="Jenis Identitas"
          options={jenisIdentitasOptions}
          error={errors.jenisIdentitas}
          registration={register("jenisIdentitas")}
        />
        <TextField
          label="Nomor Identitas"
          error={errors.nomorIdentitas}
          registration={register("nomorIdentitas")}
        />
        <TextField
          label="Tempat Lahir"
          error={errors.tempatLahir}
          registration={register("tempatLahir")}
        />
        <TextField
          label="Tanggal Lahir"
          type="date"
          error={errors.tanggalLahir}
          registration={register("tanggalLahir")}
        />
        <SelectField
          label="Jenis High Risk Customer"
          options={jenisHighRiskCustomerOptions}
          error={errors.jenisHighRiskCustomer}
          registration={register("jenisHighRiskCustomer")}
        />
        <TextField
          label="Metode Pembayaran"
          error={errors.metodePembayaran}
          registration={register("metodePembayaran")}
        />
        <TextField
          label="Nama Perusahaan Tempat Bekerja"
          error={errors.namaPerusahaanTempatBekerja}
          registration={register("namaPerusahaanTempatBekerja")}
        />
        <SelectField
          label="Jumlah Penghasilan per Bulan"
          options={penghasilanOptions}
          error={errors.jumlahPenghasilanPerBulan}
          registration={register("jumlahPenghasilanPerBulan")}
        />
        <FullRow>
          <TextAreaField
            label="Alamat Sesuai Identitas"
            error={errors.alamatSesuaiIdentitas}
            registration={register("alamatSesuaiIdentitas")}
          />
        </FullRow>
        <div className="flex flex-col gap-4">
          <SelectField
            label="Tujuan Transaksi"
            options={tujuanTransaksiOptions}
            error={errors.tujuanTransaksi}
            registration={register("tujuanTransaksi")}
          />
          {tujuanTransaksi === "LAIN_LAIN" && (
            <TextField
              label="Tujuan Transaksi Lainnya"
              error={errors.tujuanTransaksiLainnya}
              registration={register("tujuanTransaksiLainnya")}
            />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <SelectField
            label="Sumber Kekayaan"
            options={sumberKekayaanOptions}
            error={errors.sumberKekayaan}
            registration={register("sumberKekayaan")}
          />
          {sumberKekayaan === "LAIN_LAIN" && (
            <TextField
              label="Sumber Kekayaan Lainnya"
              error={errors.sumberKekayaanLainnya}
              registration={register("sumberKekayaanLainnya")}
            />
          )}
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary px-5 py-2.5 text-sm shadow-sm"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Informasi Tambahan"}
        </button>
      </div>
    </form>
  );
}
