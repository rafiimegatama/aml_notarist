import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  DetailSection,
  DetailItem,
  formatDate,
} from "@/components/detail/DetailPrimitives";
import { ExportToSheetButton } from "@/components/detail/ExportToSheetButton";
import { CompletionChecklist } from "@/components/detail/CompletionChecklist";
import { getCompletionBreakdown } from "@/lib/status";
import { getRetentionReviewDate, RETENTION_YEARS } from "@/lib/retention";
import {
  customerTypeLabels,
  customerStatusLabels,
  riskCategoryLabels,
  jenisIdentitasLabels,
  jenisKelaminLabels,
  statusPernikahanLabels,
  sumberPendapatanLabels,
  pendapatanRangeLabels,
  hubunganHukumPengurusLabels,
  pepAsalNegaraLabels,
  pepJabatanLabels,
  pepHubunganLabels,
  jenisIdentitasEddLabels,
  jenisHighRiskCustomerLabels,
  tujuanTransaksiEddLabels,
  sumberKekayaanEddLabels,
  penghasilanBulananEddLabels,
} from "@/lib/labels";

function yesNo(value: boolean | null | undefined): string | null {
  if (value === true) return "Ya";
  if (value === false) return "Tidak";
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      corporateDetail: { select: { namaKorporasi: true } },
      individualDetail: { select: { namaLengkap: true } },
      legalArrangementDetail: { select: { nama: true } },
    },
  });
  const name =
    customer?.corporateDetail?.namaKorporasi ??
    customer?.individualDetail?.namaLengkap ??
    customer?.legalArrangementDetail?.nama ??
    "Detail CDD";
  return { title: name };
}

export default async function CddDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, businessSectorActiveCount] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        corporateDetail: true,
        individualDetail: true,
        legalArrangementDetail: true,
        beneficialOwners: true,
        powerOfAttorney: true,
        legalArrangementParties: true,
        notaryService: true,
        riskAssessment: {
          include: {
            userProfileScore: true,
            businessSectorScore: true,
            regionScore: true,
            countryScore: true,
            notaryServiceTypeScore: true,
          },
        },
        highRiskAdditionalInfo: true,
        documents: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.refBusinessSectorScore.count({ where: { isActive: true } }),
  ]);

  if (!customer) notFound();

  const breakdown = await getCompletionBreakdown(id);

  const displayName =
    customer.corporateDetail?.namaKorporasi ??
    customer.individualDetail?.namaLengkap ??
    customer.legalArrangementDetail?.nama ??
    "(tanpa nama)";

  const businessSectorEmpty = businessSectorActiveCount === 0;
  const ra = customer.riskAssessment;
  const riskCategory = ra?.riskCategory ?? null;
  const isHighRisk = riskCategory === "TINGGI";
  const eddDone = !!customer.highRiskAdditionalInfo;
  const retentionReviewDate = getRetentionReviewDate(customer.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {customerTypeLabels[customer.type]} ·{" "}
            <span
              className={
                customer.status === "COMPLETE"
                  ? "font-medium text-green-700"
                  : "font-medium text-amber-700"
              }
            >
              {customerStatusLabels[customer.status]}
            </span>{" "}
            · Dibuat {formatDate(customer.createdAt)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Tinjau retensi data pada {formatDate(retentionReviewDate)} (FR-5,
            asumsi {RETENTION_YEARS} tahun — konfirmasi ke penasihat hukum)
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/cdd/${customer.id}/risk-assessment`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {ra ? "Edit Risk Assessment" : "Lanjut ke Risk Assessment"}
          </Link>
          <Link
            href={`/cdd/${customer.id}/pdf`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Export PDF
          </Link>
          <ExportToSheetButton customerId={customer.id} />
        </div>
      </div>

      <CompletionChecklist breakdown={breakdown} />

      {businessSectorEmpty && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Skor Bisnis (RefBusinessSectorScore) belum tersedia — Total Nilai
          Risk Assessment belum bisa dianggap final untuk CDD manapun.
          Lengkapi di halaman Referensi Data.
        </div>
      )}

      {isHighRisk && customer.type === "PERORANGAN" && !eddDone && (
        <div
          id="edd"
          className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>
            Kategori Risiko <strong>Tinggi</strong> — Informasi Tambahan (EDD)
            wajib diisi sebelum CDD ini dianggap lengkap.
          </span>
          <Link
            href={`/cdd/${customer.id}/edd`}
            className="ml-4 shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
          >
            Isi Informasi Tambahan
          </Link>
        </div>
      )}

      {isHighRisk && customer.type !== "PERORANGAN" && (
        <div
          id="edd"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          EDD Korporasi/Legal Arrangement belum tersedia di sistem — proses
          ini wajib ditangani manual di luar aplikasi sampai form EDD resmi
          tersedia (Known Gap #2, lihat reference-data.md bagian 9 dan PRD
          Fase 2 Bagian 7). Status CDD ini tidak akan otomatis menjadi
          Lengkap.
        </div>
      )}

      {/* ============ KORPORASI ============ */}
      {customer.type === "KORPORASI" && customer.corporateDetail && (
        <>
          <DetailSection id="cdd-dasar" title="A. Informasi Dasar Pengguna Jasa">
            <DetailItem label="Nama Korporasi" value={customer.corporateDetail.namaKorporasi} />
            <DetailItem label="Bentuk Korporasi" value={customer.corporateDetail.bentukKorporasi} />
            <DetailItem label="No. SK Pengesahan" value={customer.corporateDetail.noSkPengesahan} />
            <DetailItem label="Tanggal SK Pengesahan" value={formatDate(customer.corporateDetail.tanggalSkPengesahan)} />
            <DetailItem label="No. Ijin Usaha" value={customer.corporateDetail.noIjinUsaha} />
            <DetailItem label="Tanggal Ijin Usaha" value={formatDate(customer.corporateDetail.tanggalIjinUsaha)} />
            <DetailItem label="NPWP" value={customer.corporateDetail.npwp} />
            <DetailItem label="No. Akta Pendirian" value={customer.corporateDetail.noAktaPendirian} />
            <DetailItem label="Nomor Telepon" value={customer.corporateDetail.nomorTelepon} />
            <DetailItem label="Nomor Faksimili" value={customer.corporateDetail.nomorFaksimili} />
            <DetailItem label="Bidang Usaha" value={customer.corporateDetail.bidangUsaha} full />
            <DetailItem label="Alamat sesuai Akta" value={customer.corporateDetail.alamatSesuaiAkta} full />
            <DetailItem label="Alamat Lokasi Usaha" value={customer.corporateDetail.alamatLokasiUsaha} full />
          </DetailSection>

          <DetailSection title="B. Informasi Kekayaan Korporasi">
            <DetailItem label="Sumber Dana" value={customer.corporateDetail.sumberDana} />
            <DetailItem label="Pendapatan Rata-Rata per Tahun" value={customer.corporateDetail.pendapatanRataRata} />
            <DetailItem label="Tujuan Transaksi" value={customer.corporateDetail.tujuanTransaksi} full />
          </DetailSection>
        </>
      )}

      {/* ============ PERORANGAN ============ */}
      {customer.type === "PERORANGAN" && customer.individualDetail && (
        <>
          <DetailSection id="cdd-dasar" title="A. Informasi Dasar Pengguna Jasa">
            <DetailItem label="Nama Lengkap" value={customer.individualDetail.namaLengkap} />
            <DetailItem label="Nama Alias" value={customer.individualDetail.namaAlias} />
            <DetailItem label="Jenis Identitas" value={jenisIdentitasLabels[customer.individualDetail.jenisIdentitas]} />
            <DetailItem label="No. Identitas" value={customer.individualDetail.noIdentitas} />
            <DetailItem label="NPWP" value={customer.individualDetail.npwp} />
            <DetailItem label="Tempat Lahir" value={customer.individualDetail.tempatLahir} />
            <DetailItem label="Tanggal Lahir" value={formatDate(customer.individualDetail.tanggalLahir)} />
            <DetailItem label="Kewarganegaraan" value={customer.individualDetail.kewarganegaraan} />
            <DetailItem label="Jenis Kelamin" value={jenisKelaminLabels[customer.individualDetail.jenisKelamin]} />
            <DetailItem
              label="Status Pernikahan"
              value={
                statusPernikahanLabels[customer.individualDetail.statusPernikahan] +
                (customer.individualDetail.statusPernikahan === "LAINNYA" && customer.individualDetail.statusPernikahanLainnya
                  ? ` (${customer.individualDetail.statusPernikahanLainnya})`
                  : "")
              }
            />
            <DetailItem label="Nomor Telepon Rumah" value={customer.individualDetail.nomorTeleponRumah} />
            <DetailItem label="Nomor HP" value={customer.individualDetail.nomorHp} />
            <DetailItem label="Alamat Tempat Tinggal" value={customer.individualDetail.alamatTempatTinggal} full />
            <DetailItem label="Alamat Domisili" value={customer.individualDetail.alamatDomisili} full />
            <DetailItem label="Alamat di Negara Asal" value={customer.individualDetail.alamatNegaraAsal} full />
          </DetailSection>

          <DetailSection title="B. Informasi Pekerjaan dan Sumber Pendapatan">
            <DetailItem
              label="Sumber Pendapatan/Kekayaan"
              value={
                customer.individualDetail.sumberPendapatan
                  ? sumberPendapatanLabels[customer.individualDetail.sumberPendapatan] +
                    (customer.individualDetail.sumberPendapatan === "LAINNYA" && customer.individualDetail.sumberPendapatanLainnya
                      ? ` (${customer.individualDetail.sumberPendapatanLainnya})`
                      : "")
                  : null
              }
            />
            <DetailItem label="Bidang Usaha" value={customer.individualDetail.bidangUsaha} />
            <DetailItem label="Nama Kantor" value={customer.individualDetail.namaKantor} />
            <DetailItem label="Nomor Telepon Kantor" value={customer.individualDetail.nomorTeleponKantor} />
            <DetailItem label="Jabatan" value={customer.individualDetail.jabatan} />
            <DetailItem
              label="Pendapatan Rata-Rata per Tahun"
              value={
                customer.individualDetail.pendapatanRataRata
                  ? pendapatanRangeLabels[customer.individualDetail.pendapatanRataRata]
                  : null
              }
            />
            <DetailItem label="Alamat Kantor" value={customer.individualDetail.alamatKantor} full />
            <DetailItem label="Tujuan Transaksi" value={customer.individualDetail.tujuanTransaksi} full />
          </DetailSection>
        </>
      )}

      {/* ============ LEGAL ARRANGEMENT ============ */}
      {customer.type === "LEGAL_ARRANGEMENT" && customer.legalArrangementDetail && (
        <>
          <DetailSection id="cdd-dasar" title="A. Informasi Dasar Pengguna Jasa">
            <DetailItem label="Nama" value={customer.legalArrangementDetail.nama} />
            <DetailItem
              label="Jenis Identitas"
              value={
                customer.legalArrangementDetail.jenisIdentitas
                  ? jenisIdentitasLabels[customer.legalArrangementDetail.jenisIdentitas]
                  : null
              }
            />
            <DetailItem label="No. Identitas" value={customer.legalArrangementDetail.noIdentitas} />
            <DetailItem label="No. SK Pengesahan" value={customer.legalArrangementDetail.noSkPengesahan} />
            <DetailItem label="Tanggal SK Pengesahan" value={formatDate(customer.legalArrangementDetail.tanggalSkPengesahan)} />
            <DetailItem label="No. Ijin Usaha" value={customer.legalArrangementDetail.noIjinUsaha} />
            <DetailItem label="Tanggal Ijin Usaha" value={formatDate(customer.legalArrangementDetail.tanggalIjinUsaha)} />
            <DetailItem label="NPWP" value={customer.legalArrangementDetail.npwp} />
            <DetailItem label="Nomor Telepon" value={customer.legalArrangementDetail.nomorTelepon} />
            <DetailItem label="Nomor Faksimili" value={customer.legalArrangementDetail.nomorFaksimili} />
            <DetailItem label="Bidang Usaha" value={customer.legalArrangementDetail.bidangUsaha} />
            <DetailItem label="No. Akta Pendirian" value={customer.legalArrangementDetail.noAktaPendirian} />
            <DetailItem label="Alamat" value={customer.legalArrangementDetail.alamat} full />
          </DetailSection>

          <DetailSection title="B. Informasi Kekayaan">
            <DetailItem label="Sumber Dana" value={customer.legalArrangementDetail.sumberDana} />
            <DetailItem label="Pendapatan Rata-Rata per Tahun" value={customer.legalArrangementDetail.pendapatanRataRata} />
            <DetailItem label="Tujuan Transaksi" value={customer.legalArrangementDetail.tujuanTransaksi} full />
          </DetailSection>
        </>
      )}

      {/* ============ Beneficial Owners (semua tipe) ============ */}
      <DetailSection
        id="beneficial-owner"
        title="Informasi Pemilik Manfaat (Beneficial Owner)"
        description={`${customer.beneficialOwners.length} orang`}
      >
        {customer.beneficialOwners.length === 0 && (
          <p className="text-sm text-gray-500 sm:col-span-2">
            Tidak ada Pemilik Manfaat tercatat.
          </p>
        )}
        {customer.beneficialOwners.map((bo, i) => (
          <div key={bo.id} className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Pemilik Manfaat #{i + 1}
            </h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
              <DetailItem label="Nama Lengkap" value={bo.namaLengkap} />
              <DetailItem label="Nama Alias" value={bo.namaAlias} />
              <DetailItem label="Jenis Identitas" value={bo.jenisIdentitas ? jenisIdentitasLabels[bo.jenisIdentitas] : null} />
              <DetailItem label="No. Identitas" value={bo.noIdentitas} />
              <DetailItem label="Tempat Lahir" value={bo.tempatLahir} />
              <DetailItem label="Tanggal Lahir" value={formatDate(bo.tanggalLahir)} />
              <DetailItem label="Kewarganegaraan" value={bo.kewarganegaraan} />
              <DetailItem label="NPWP" value={bo.npwp} />
              <DetailItem label="Alamat Tempat Tinggal" value={bo.alamatTempatTinggal} full />
              <DetailItem label="Alamat di Negara Asal" value={bo.alamatNegaraAsal} full />
              <DetailItem label="Hubungan dengan Pengguna Jasa" value={bo.hubunganDenganPenggunaJasa} full />
            </dl>
          </div>
        ))}
      </DetailSection>

      {/* ============ Power of Attorney (Korporasi) ============ */}
      {customer.type === "KORPORASI" && customer.powerOfAttorney && (
        <DetailSection id="power-of-attorney" title="D. Informasi Kuasa Korporasi">
          <DetailItem label="Hubungan Hukum Pengguna Jasa" value={hubunganHukumPengurusLabels[customer.powerOfAttorney.hubunganHukum]} />
          <DetailItem label="No. Surat Kuasa" value={customer.powerOfAttorney.noSuratKuasa} />
          <DetailItem label="Tanggal Surat Kuasa" value={formatDate(customer.powerOfAttorney.tanggalSuratKuasa)} />
          <DetailItem label="Penandatangan Surat Kuasa" value={customer.powerOfAttorney.penandatanganSuratKuasa} />
          <DetailItem label="Jabatan Penandatangan" value={customer.powerOfAttorney.jabatanPenandatangan} />
          <DetailItem label="Nama Lengkap Pengguna Jasa" value={customer.powerOfAttorney.namaLengkapPenggunaJasa} />
          <DetailItem label="Nama Alias" value={customer.powerOfAttorney.namaAlias} />
          <DetailItem
            label="Jenis Identitas Pengguna Jasa"
            value={customer.powerOfAttorney.jenisIdentitasPenggunaJasa ? jenisIdentitasLabels[customer.powerOfAttorney.jenisIdentitasPenggunaJasa] : null}
          />
          <DetailItem label="No. Identitas Pengguna Jasa" value={customer.powerOfAttorney.noIdentitasPenggunaJasa} />
          <DetailItem label="Tempat Lahir" value={customer.powerOfAttorney.tempatLahir} />
          <DetailItem label="Tanggal Lahir" value={formatDate(customer.powerOfAttorney.tanggalLahir)} />
          <DetailItem label="Kewarganegaraan" value={customer.powerOfAttorney.kewarganegaraan} />
          <DetailItem label="Alamat Tempat Tinggal" value={customer.powerOfAttorney.alamatTempatTinggal} full />
        </DetailSection>
      )}

      {/* ============ Legal Arrangement Parties ============ */}
      {customer.type === "LEGAL_ARRANGEMENT" && (
        <DetailSection
          title="D. Informasi Pihak dalam Legal Arrangement"
          description={`${customer.legalArrangementParties.length} pihak`}
        >
          {customer.legalArrangementParties.length === 0 && (
            <p className="text-sm text-gray-500 sm:col-span-2">
              Tidak ada pihak tercatat.
            </p>
          )}
          {customer.legalArrangementParties.map((party, i) => (
            <div key={party.id} className="sm:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Pihak #{i + 1}
              </h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
                <DetailItem label="Nama Lengkap" value={party.namaLengkap} />
                <DetailItem label="Nama Alias" value={party.namaAlias} />
                <DetailItem label="Jenis Identitas" value={party.jenisIdentitas ? jenisIdentitasLabels[party.jenisIdentitas] : null} />
                <DetailItem label="No. Identitas" value={party.noIdentitas} />
                <DetailItem label="Tempat Lahir" value={party.tempatLahir} />
                <DetailItem label="Tanggal Lahir" value={formatDate(party.tanggalLahir)} />
                <DetailItem label="Kewarganegaraan" value={party.kewarganegaraan} />
                <DetailItem label="Hubungan Hukum Pengguna Jasa" value={party.hubunganHukumPenggunaJasa} />
                <DetailItem label="No. Perjanjian" value={party.noPerjanjian} />
                <DetailItem label="Tanggal Perjanjian" value={formatDate(party.tanggalPerjanjian)} />
                <DetailItem label="Alamat Tempat Tinggal" value={party.alamatTempatTinggal} full />
                <DetailItem label="Penandatanganan Perjanjian" value={party.penandatangananPerjanjian} full />
              </dl>
            </div>
          ))}
        </DetailSection>
      )}

      {/* ============ Notary Service (semua tipe) ============ */}
      {customer.notaryService && (
        <DetailSection id="notary-service" title="Informasi Jasa yang Diberikan">
          <DetailItem label="Nama Notaris" value={customer.notaryService.namaNotaris} />
          <DetailItem label="Jasa yang Diberikan" value={customer.notaryService.jasaYangDiberikan} />
        </DetailSection>
      )}

      {/* ============ Risk Assessment ============ */}
      <DetailSection id="risk-assessment" title="Risk Assessment — Analisa PEP & Skoring">
        <DetailItem label="Apakah Pengguna Jasa adalah PEP?" value={yesNo(ra?.isPep)} />
        <DetailItem label="Nama Lengkap PEP" value={ra?.namaLengkapPep} />
        <DetailItem label="PEP Lokal atau Asing" value={ra?.pepAsalNegara ? pepAsalNegaraLabels[ra.pepAsalNegara] : null} />
        <DetailItem label="Warga Negara PEP" value={ra?.wargaNegaraPep} />
        <DetailItem label="Ada Berita Negatif Terkait PEP" value={yesNo(ra?.adaBeritaNegatif)} />
        <DetailItem label="Jabatan PEP" value={ra?.jabatanPep ? pepJabatanLabels[ra.jabatanPep] : null} />
        <DetailItem label="Hubungan dengan PEP" value={ra?.hubunganDenganPep ? pepHubunganLabels[ra.hubunganDenganPep] : null} full />

        <DetailItem
          label="Profil Pengguna Jasa dan/atau BO"
          value={ra?.userProfileScore ? `${ra.userProfileScore.categoryName} (${ra.userProfileScore.score})` : null}
        />
        <DetailItem
          label="Profil Bisnis Pengguna Jasa dan/atau BO"
          value={
            ra?.businessSectorScore
              ? `${ra.businessSectorScore.categoryName}${ra.businessSectorScore.score != null ? ` (${ra.businessSectorScore.score})` : ""}`
              : null
          }
        />
        <DetailItem
          label="Profil Wilayah Pengguna Jasa dan/atau BO"
          value={ra?.regionScore ? `${ra.regionScore.categoryName} (${ra.regionScore.score})` : null}
        />
        <DetailItem
          label="Profil Negara Asal Pengguna Jasa dan/atau BO"
          value={ra?.countryScore ? `${ra.countryScore.categoryName} (${ra.countryScore.score})` : null}
        />
        <DetailItem
          label="Profil Jasa yang Diberikan oleh Notaris"
          value={ra?.notaryServiceTypeScore ? `${ra.notaryServiceTypeScore.categoryName} (${ra.notaryServiceTypeScore.score})` : null}
        />
        <DetailItem label="Total Nilai" value={ra?.totalScore ?? "Belum final"} />
        <DetailItem label="Kategori Risiko" value={riskCategory ? riskCategoryLabels[riskCategory] : "Belum final"} />
      </DetailSection>

      {/* ============ EDD ============ */}
      {customer.highRiskAdditionalInfo && (
        <DetailSection id="edd" title="Informasi Tambahan — Berisiko Tinggi (EDD)">
          <DetailItem label="Nama Lengkap" value={customer.highRiskAdditionalInfo.namaLengkap} />
          <DetailItem
            label="Jenis Identitas"
            value={customer.highRiskAdditionalInfo.jenisIdentitas ? jenisIdentitasEddLabels[customer.highRiskAdditionalInfo.jenisIdentitas] : null}
          />
          <DetailItem label="Nomor Identitas" value={customer.highRiskAdditionalInfo.nomorIdentitas} />
          <DetailItem label="Tempat Lahir" value={customer.highRiskAdditionalInfo.tempatLahir} />
          <DetailItem label="Tanggal Lahir" value={formatDate(customer.highRiskAdditionalInfo.tanggalLahir)} />
          <DetailItem
            label="Jenis High Risk Customer"
            value={customer.highRiskAdditionalInfo.jenisHighRiskCustomer ? jenisHighRiskCustomerLabels[customer.highRiskAdditionalInfo.jenisHighRiskCustomer] : null}
          />
          <DetailItem label="Metode Pembayaran" value={customer.highRiskAdditionalInfo.metodePembayaran} />
          <DetailItem label="Nama Perusahaan Tempat Bekerja" value={customer.highRiskAdditionalInfo.namaPerusahaanTempatBekerja} />
          <DetailItem
            label="Jumlah Penghasilan per Bulan"
            value={customer.highRiskAdditionalInfo.jumlahPenghasilanPerBulan ? penghasilanBulananEddLabels[customer.highRiskAdditionalInfo.jumlahPenghasilanPerBulan] : null}
          />
          <DetailItem
            label="Tujuan Transaksi"
            value={
              customer.highRiskAdditionalInfo.tujuanTransaksi
                ? tujuanTransaksiEddLabels[customer.highRiskAdditionalInfo.tujuanTransaksi] +
                  (customer.highRiskAdditionalInfo.tujuanTransaksi === "LAIN_LAIN" && customer.highRiskAdditionalInfo.tujuanTransaksiLainnya
                    ? ` (${customer.highRiskAdditionalInfo.tujuanTransaksiLainnya})`
                    : "")
                : null
            }
          />
          <DetailItem
            label="Sumber Kekayaan"
            value={
              customer.highRiskAdditionalInfo.sumberKekayaan
                ? sumberKekayaanEddLabels[customer.highRiskAdditionalInfo.sumberKekayaan] +
                  (customer.highRiskAdditionalInfo.sumberKekayaan === "LAIN_LAIN" && customer.highRiskAdditionalInfo.sumberKekayaanLainnya
                    ? ` (${customer.highRiskAdditionalInfo.sumberKekayaanLainnya})`
                    : "")
                : null
            }
          />
          <DetailItem label="Alamat Sesuai Identitas" value={customer.highRiskAdditionalInfo.alamatSesuaiIdentitas} full />
        </DetailSection>
      )}

      {/* ============ Dokumen Terlampir (foto/scan formulir cetak) ============ */}
      {customer.documents.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Dokumen Terlampir
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Foto/scan formulir cetak yang diupload untuk OCR saat CDD ini
            dibuat.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {customer.documents.map((doc) => (
              <a
                key={doc.id}
                href={`/api/documents/${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-md border border-gray-200 hover:border-blue-400"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- foto lokal dari disk, bukan aset yang perlu dioptimasi Next/Image */}
                <img
                  src={`/api/documents/${doc.id}`}
                  alt={doc.fileName}
                  className="h-32 w-full object-cover"
                />
                <span className="block truncate px-2 py-1 text-xs text-gray-600">
                  {doc.fileName}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
