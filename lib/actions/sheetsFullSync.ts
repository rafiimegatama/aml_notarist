"use server";

import { prisma } from "@/lib/prisma";
import {
  getSheetsConfig,
  updateRange,
  clearRange,
  ensureTabsExist,
  columnLetter,
  type SheetsConfig,
} from "@/lib/googleSheets/client";
import {
  jenisIdentitasLabels,
  jenisKelaminLabels,
  statusPernikahanLabels,
  sumberPendapatanLabels,
  pendapatanRangeLabels,
  hubunganHukumPengurusLabels,
  pepAsalNegaraLabels,
  pepJabatanLabels,
  pepHubunganLabels,
  riskCategoryLabels,
  jenisIdentitasEddLabels,
  jenisHighRiskCustomerLabels,
  tujuanTransaksiEddLabels,
  sumberKekayaanEddLabels,
  penghasilanBulananEddLabels,
} from "@/lib/labels";
import { fmtDate, fmtDateTime, fmtStr, fmtInt, fmtTriBool } from "@/lib/googleSheets/format";
import {
  TAB_CDD_PERORANGAN,
  TAB_CDD_KORPORASI,
  TAB_CDD_PERIKATAN_LAINNYA,
  TAB_BENEFICIAL_OWNERS,
  TAB_KUASA_KORPORASI,
  TAB_PIHAK_PERIKATAN,
  TAB_RISK_ASSESSMENT,
  TAB_EDD_BERISIKO_TINGGI,
  TAB_ACTIVITY_LOG,
  TAB_REFERENSI_SKOR,
  ALL_DETAIL_TABS,
} from "@/lib/googleSheets/tabs";

export type FullSyncResult =
  | { success: true; counts: Record<string, number> }
  | { success: false; error: string };

/**
 * Tulis ulang satu tab secara penuh: header + seluruh baris data, dari nol
 * tiap kali dipanggil. Dipilih dibanding upsert per-baris karena sebagian
 * besar tab di sini adalah 1:N (BeneficialOwners, PihakPerikatan,
 * ActivityLog) — diff per-baris anak jauh lebih rumit daripada "hapus lalu
 * tulis ulang semua", dan di skala satu kantor notaris ini tetap murah.
 * Tab spine (rollup per Customer) TIDAK lewat sini — itu tetap upsert
 * per-customer di lib/actions/sheetsExport.ts supaya trigger real-time
 * (status -> Lengkap) tidak perlu menulis ulang seluruh buku tiap kali.
 */
async function rewriteTab(
  config: SheetsConfig,
  tabName: string,
  headers: string[],
  rows: string[][]
): Promise<void> {
  const lastColumn = columnLetter(headers.length);
  await updateRange(config, `${tabName}!A1:${lastColumn}1`, [headers]);
  await clearRange(config, `${tabName}!A2:${lastColumn}`);
  if (rows.length > 0) {
    await updateRange(
      config,
      `${tabName}!A2:${lastColumn}${rows.length + 1}`,
      rows
    );
  }
}

/**
 * Full rebuild sinkronisasi seluruh tab detail (Fase 2-4 desain skema) dari
 * data Prisma saat ini. Dipanggil manual (mis. skrip
 * scripts/sync-google-sheets.ts) — bukan realtime per-submit seperti tab
 * spine, karena replace-all lebih cocok dijalankan sebagai batch job.
 */
export async function syncAllDetailTabsToSheet(): Promise<FullSyncResult> {
  const config = getSheetsConfig();
  if (!config) {
    return {
      success: false,
      error:
        "Integrasi Google Sheets belum dikonfigurasi. Set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY di .env.",
    };
  }

  try {
    await ensureTabsExist(config, [...ALL_DETAIL_TABS]);

    const customers = await prisma.customer.findMany({
      include: {
        corporateDetail: true,
        individualDetail: true,
        legalArrangementDetail: true,
        beneficialOwners: true,
        powerOfAttorney: true,
        legalArrangementParties: true,
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
        activityLog: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    const counts: Record<string, number> = {};

    // -- CDD_Perorangan --
    {
      const headers = [
        "customer_id", "nama_lengkap", "nama_alias", "jenis_identitas", "no_identitas",
        "npwp", "tempat_lahir", "tanggal_lahir", "kewarganegaraan",
        "alamat_tempat_tinggal", "alamat_domisili", "alamat_negara_asal",
        "nomor_telepon_rumah", "nomor_hp", "jenis_kelamin", "status_pernikahan",
        "status_pernikahan_lainnya", "sumber_pendapatan", "sumber_pendapatan_lainnya",
        "bidang_usaha", "nama_kantor", "alamat_kantor", "nomor_telepon_kantor",
        "jabatan", "pendapatan_rata_rata", "tujuan_transaksi",
      ];
      const rows = customers
        .filter((c) => c.individualDetail)
        .map((c) => {
          const d = c.individualDetail!;
          return [
            c.id, d.namaLengkap, fmtStr(d.namaAlias), jenisIdentitasLabels[d.jenisIdentitas],
            fmtStr(d.noIdentitas), fmtStr(d.npwp), fmtStr(d.tempatLahir), fmtDate(d.tanggalLahir),
            fmtStr(d.kewarganegaraan), fmtStr(d.alamatTempatTinggal), fmtStr(d.alamatDomisili),
            fmtStr(d.alamatNegaraAsal), fmtStr(d.nomorTeleponRumah), fmtStr(d.nomorHp),
            jenisKelaminLabels[d.jenisKelamin], statusPernikahanLabels[d.statusPernikahan],
            fmtStr(d.statusPernikahanLainnya),
            d.sumberPendapatan ? sumberPendapatanLabels[d.sumberPendapatan] : "",
            fmtStr(d.sumberPendapatanLainnya), fmtStr(d.bidangUsaha), fmtStr(d.namaKantor),
            fmtStr(d.alamatKantor), fmtStr(d.nomorTeleponKantor), fmtStr(d.jabatan),
            d.pendapatanRataRata ? pendapatanRangeLabels[d.pendapatanRataRata] : "",
            fmtStr(d.tujuanTransaksi),
          ];
        });
      await rewriteTab(config, TAB_CDD_PERORANGAN, headers, rows);
      counts[TAB_CDD_PERORANGAN] = rows.length;
    }

    // -- CDD_Korporasi --
    {
      const headers = [
        "customer_id", "nama_korporasi", "bentuk_korporasi", "no_sk_pengesahan",
        "tanggal_sk_pengesahan", "no_ijin_usaha", "tanggal_ijin_usaha", "npwp",
        "alamat_sesuai_akta", "alamat_lokasi_usaha", "nomor_telepon", "nomor_faksimili",
        "bidang_usaha", "no_akta_pendirian", "sumber_dana", "pendapatan_rata_rata",
        "tujuan_transaksi",
      ];
      const rows = customers
        .filter((c) => c.corporateDetail)
        .map((c) => {
          const d = c.corporateDetail!;
          return [
            c.id, d.namaKorporasi, fmtStr(d.bentukKorporasi), fmtStr(d.noSkPengesahan),
            fmtDate(d.tanggalSkPengesahan), fmtStr(d.noIjinUsaha), fmtDate(d.tanggalIjinUsaha),
            fmtStr(d.npwp), fmtStr(d.alamatSesuaiAkta), fmtStr(d.alamatLokasiUsaha),
            fmtStr(d.nomorTelepon), fmtStr(d.nomorFaksimili), fmtStr(d.bidangUsaha),
            fmtStr(d.noAktaPendirian), fmtStr(d.sumberDana), fmtStr(d.pendapatanRataRata),
            fmtStr(d.tujuanTransaksi),
          ];
        });
      await rewriteTab(config, TAB_CDD_KORPORASI, headers, rows);
      counts[TAB_CDD_KORPORASI] = rows.length;
    }

    // -- CDD_PerikatanLainnya --
    {
      const headers = [
        "customer_id", "nama", "jenis_identitas", "no_identitas", "no_sk_pengesahan",
        "tanggal_sk_pengesahan", "no_ijin_usaha", "tanggal_ijin_usaha", "npwp", "alamat",
        "nomor_telepon", "nomor_faksimili", "bidang_usaha", "no_akta_pendirian",
        "sumber_dana", "pendapatan_rata_rata", "tujuan_transaksi",
      ];
      const rows = customers
        .filter((c) => c.legalArrangementDetail)
        .map((c) => {
          const d = c.legalArrangementDetail!;
          return [
            c.id, d.nama, d.jenisIdentitas ? jenisIdentitasLabels[d.jenisIdentitas] : "",
            fmtStr(d.noIdentitas), fmtStr(d.noSkPengesahan), fmtDate(d.tanggalSkPengesahan),
            fmtStr(d.noIjinUsaha), fmtDate(d.tanggalIjinUsaha), fmtStr(d.npwp), fmtStr(d.alamat),
            fmtStr(d.nomorTelepon), fmtStr(d.nomorFaksimili), fmtStr(d.bidangUsaha),
            fmtStr(d.noAktaPendirian), fmtStr(d.sumberDana), fmtStr(d.pendapatanRataRata),
            fmtStr(d.tujuanTransaksi),
          ];
        });
      await rewriteTab(config, TAB_CDD_PERIKATAN_LAINNYA, headers, rows);
      counts[TAB_CDD_PERIKATAN_LAINNYA] = rows.length;
    }

    // -- BeneficialOwners (1:N) --
    {
      const headers = [
        "bo_id", "customer_id", "nama_lengkap", "nama_alias", "jenis_identitas",
        "no_identitas", "tempat_lahir", "tanggal_lahir", "kewarganegaraan",
        "alamat_tempat_tinggal", "alamat_negara_asal", "npwp",
        "hubungan_dengan_pengguna_jasa",
      ];
      const rows = customers.flatMap((c) =>
        c.beneficialOwners.map((bo) => [
          bo.id, c.id, bo.namaLengkap, fmtStr(bo.namaAlias),
          bo.jenisIdentitas ? jenisIdentitasLabels[bo.jenisIdentitas] : "",
          fmtStr(bo.noIdentitas), fmtStr(bo.tempatLahir), fmtDate(bo.tanggalLahir),
          fmtStr(bo.kewarganegaraan), fmtStr(bo.alamatTempatTinggal),
          fmtStr(bo.alamatNegaraAsal), fmtStr(bo.npwp),
          fmtStr(bo.hubunganDenganPenggunaJasa),
        ])
      );
      await rewriteTab(config, TAB_BENEFICIAL_OWNERS, headers, rows);
      counts[TAB_BENEFICIAL_OWNERS] = rows.length;
    }

    // -- KuasaKorporasi --
    {
      const headers = [
        "customer_id", "hubungan_hukum", "no_surat_kuasa", "tanggal_surat_kuasa",
        "penandatangan_surat_kuasa", "jabatan_penandatangan",
        "nama_lengkap_pengguna_jasa", "nama_alias", "jenis_identitas_pengguna_jasa",
        "no_identitas_pengguna_jasa", "tempat_lahir", "tanggal_lahir",
        "kewarganegaraan", "alamat_tempat_tinggal",
      ];
      const rows = customers
        .filter((c) => c.powerOfAttorney)
        .map((c) => {
          const d = c.powerOfAttorney!;
          return [
            c.id, hubunganHukumPengurusLabels[d.hubunganHukum], fmtStr(d.noSuratKuasa),
            fmtDate(d.tanggalSuratKuasa), fmtStr(d.penandatanganSuratKuasa),
            fmtStr(d.jabatanPenandatangan), fmtStr(d.namaLengkapPenggunaJasa),
            fmtStr(d.namaAlias),
            d.jenisIdentitasPenggunaJasa ? jenisIdentitasLabels[d.jenisIdentitasPenggunaJasa] : "",
            fmtStr(d.noIdentitasPenggunaJasa), fmtStr(d.tempatLahir), fmtDate(d.tanggalLahir),
            fmtStr(d.kewarganegaraan), fmtStr(d.alamatTempatTinggal),
          ];
        });
      await rewriteTab(config, TAB_KUASA_KORPORASI, headers, rows);
      counts[TAB_KUASA_KORPORASI] = rows.length;
    }

    // -- PihakPerikatan (1:N) --
    {
      const headers = [
        "party_id", "customer_id", "nama_lengkap", "nama_alias", "jenis_identitas",
        "no_identitas", "tempat_lahir", "tanggal_lahir", "kewarganegaraan",
        "alamat_tempat_tinggal", "hubungan_hukum_pengguna_jasa", "no_perjanjian",
        "tanggal_perjanjian", "penandatanganan_perjanjian",
      ];
      const rows = customers.flatMap((c) =>
        c.legalArrangementParties.map((p) => [
          p.id, c.id, p.namaLengkap, fmtStr(p.namaAlias),
          p.jenisIdentitas ? jenisIdentitasLabels[p.jenisIdentitas] : "",
          fmtStr(p.noIdentitas), fmtStr(p.tempatLahir), fmtDate(p.tanggalLahir),
          fmtStr(p.kewarganegaraan), fmtStr(p.alamatTempatTinggal),
          fmtStr(p.hubunganHukumPenggunaJasa), fmtStr(p.noPerjanjian),
          fmtDate(p.tanggalPerjanjian), fmtStr(p.penandatangananPerjanjian),
        ])
      );
      await rewriteTab(config, TAB_PIHAK_PERIKATAN, headers, rows);
      counts[TAB_PIHAK_PERIKATAN] = rows.length;
    }

    // -- RiskAssessment --
    {
      const headers = [
        "customer_id", "is_pep", "nama_lengkap_pep", "pep_asal_negara", "warga_negara_pep",
        "ada_berita_negatif", "jabatan_pep", "hubungan_dengan_pep",
        "profil_pengguna_jasa_kategori", "profil_pengguna_jasa_skor",
        "profil_bisnis_kategori", "profil_bisnis_skor",
        "wilayah_kategori", "wilayah_skor",
        "negara_kategori", "negara_skor",
        "jenis_layanan_kategori", "jenis_layanan_skor",
        "total_nilai_risiko", "kategori_risiko",
      ];
      const rows = customers
        .filter((c) => c.riskAssessment)
        .map((c) => {
          const ra = c.riskAssessment!;
          return [
            c.id, fmtTriBool(ra.isPep), fmtStr(ra.namaLengkapPep),
            ra.pepAsalNegara ? pepAsalNegaraLabels[ra.pepAsalNegara] : "",
            fmtStr(ra.wargaNegaraPep), fmtTriBool(ra.adaBeritaNegatif),
            ra.jabatanPep ? pepJabatanLabels[ra.jabatanPep] : "",
            ra.hubunganDenganPep ? pepHubunganLabels[ra.hubunganDenganPep] : "",
            fmtStr(ra.userProfileScore?.categoryName), fmtInt(ra.userProfileScore?.score),
            fmtStr(ra.businessSectorScore?.categoryName), fmtInt(ra.businessSectorScore?.score),
            fmtStr(ra.regionScore?.categoryName), fmtInt(ra.regionScore?.score),
            fmtStr(ra.countryScore?.categoryName), fmtInt(ra.countryScore?.score),
            fmtStr(ra.notaryServiceTypeScore?.categoryName), fmtInt(ra.notaryServiceTypeScore?.score),
            fmtInt(ra.totalScore), ra.riskCategory ? riskCategoryLabels[ra.riskCategory] : "",
          ];
        });
      await rewriteTab(config, TAB_RISK_ASSESSMENT, headers, rows);
      counts[TAB_RISK_ASSESSMENT] = rows.length;
    }

    // -- EDD_BerisikoTinggi --
    {
      const headers = [
        "customer_id", "nama_lengkap", "jenis_identitas", "nomor_identitas",
        "tempat_lahir", "tanggal_lahir", "alamat_sesuai_identitas",
        "jenis_high_risk_customer", "metode_pembayaran", "tujuan_transaksi",
        "tujuan_transaksi_lainnya", "sumber_kekayaan", "sumber_kekayaan_lainnya",
        "nama_perusahaan_tempat_bekerja", "jumlah_penghasilan_per_bulan",
      ];
      const rows = customers
        .filter((c) => c.highRiskAdditionalInfo)
        .map((c) => {
          const d = c.highRiskAdditionalInfo!;
          return [
            c.id, fmtStr(d.namaLengkap),
            d.jenisIdentitas ? jenisIdentitasEddLabels[d.jenisIdentitas] : "",
            fmtStr(d.nomorIdentitas), fmtStr(d.tempatLahir), fmtDate(d.tanggalLahir),
            fmtStr(d.alamatSesuaiIdentitas),
            d.jenisHighRiskCustomer ? jenisHighRiskCustomerLabels[d.jenisHighRiskCustomer] : "",
            fmtStr(d.metodePembayaran),
            d.tujuanTransaksi ? tujuanTransaksiEddLabels[d.tujuanTransaksi] : "",
            fmtStr(d.tujuanTransaksiLainnya),
            d.sumberKekayaan ? sumberKekayaanEddLabels[d.sumberKekayaan] : "",
            fmtStr(d.sumberKekayaanLainnya), fmtStr(d.namaPerusahaanTempatBekerja),
            d.jumlahPenghasilanPerBulan ? penghasilanBulananEddLabels[d.jumlahPenghasilanPerBulan] : "",
          ];
        });
      await rewriteTab(config, TAB_EDD_BERISIKO_TINGGI, headers, rows);
      counts[TAB_EDD_BERISIKO_TINGGI] = rows.length;
    }

    // -- ActivityLog (1:N) --
    {
      const headers = ["log_id", "customer_id", "deskripsi", "tanggal_waktu"];
      const rows = customers.flatMap((c) =>
        c.activityLog.map((log) => [
          log.id, c.id, log.description, fmtDateTime(log.createdAt),
        ])
      );
      await rewriteTab(config, TAB_ACTIVITY_LOG, headers, rows);
      counts[TAB_ACTIVITY_LOG] = rows.length;
    }

    // -- Referensi_Skor (lookup, bukan per-customer) --
    {
      const headers = ["axis", "kategori", "skor", "aktif"];
      const [userProfile, businessSector, region, country, serviceType] = await Promise.all([
        prisma.refUserProfileScore.findMany(),
        prisma.refBusinessSectorScore.findMany(),
        prisma.refRegionScore.findMany(),
        prisma.refCountryScore.findMany(),
        prisma.refNotaryServiceTypeScore.findMany(),
      ]);
      const rows = [
        ...userProfile.map((r) => ["Profil Pengguna Jasa", r.categoryName, fmtInt(r.score), fmtTriBool(r.isActive)]),
        ...businessSector.map((r) => ["Profil Bisnis", r.categoryName, fmtInt(r.score), fmtTriBool(r.isActive)]),
        ...region.map((r) => ["Wilayah", r.categoryName, fmtInt(r.score), fmtTriBool(r.isActive)]),
        ...country.map((r) => ["Negara", r.categoryName, fmtInt(r.score), fmtTriBool(r.isActive)]),
        ...serviceType.map((r) => ["Jenis Layanan Notaris", r.categoryName, fmtInt(r.score), fmtTriBool(r.isActive)]),
      ];
      await rewriteTab(config, TAB_REFERENSI_SKOR, headers, rows);
      counts[TAB_REFERENSI_SKOR] = rows.length;
    }

    return { success: true, counts };
  } catch (err) {
    console.error("Full sync ke Google Sheet gagal:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menyinkronkan seluruh tab ke Google Sheet.",
    };
  }
}
