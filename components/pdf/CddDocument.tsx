import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
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
import type { Prisma } from "@/lib/generated/prisma/client";

type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: {
    corporateDetail: true;
    individualDetail: true;
    legalArrangementDetail: true;
    beneficialOwners: true;
    powerOfAttorney: true;
    legalArrangementParties: true;
    notaryService: true;
    riskAssessment: {
      include: {
        userProfileScore: true;
        businessSectorScore: true;
        regionScore: true;
        countryScore: true;
        notaryServiceTypeScore: true;
      };
    };
    highRiskAdditionalInfo: true;
  };
}>;

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#4B5563", marginBottom: 16 },
  section: {
    marginBottom: 12,
    padding: 10,
    border: "1pt solid #E5E7EB",
    borderRadius: 4,
  },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  col: { width: "50%", paddingRight: 6 },
  label: { fontSize: 8, color: "#6B7280" },
  value: { fontSize: 9, color: "#111827" },
  subEntry: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1pt solid #F3F4F6",
  },
  subEntryTitle: { fontSize: 9, fontWeight: 700, marginBottom: 4 },
  banner: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
    fontSize: 9,
    color: "#92400E",
  },
  bannerRed: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    fontSize: 9,
    color: "#991B1B",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

function fmtDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function yesNo(v: boolean | null | undefined) {
  if (v === true) return "Ya";
  if (v === false) return "Tidak";
  return null;
}

function Item({ label, value }: { label: string; value: unknown }) {
  const display =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <View style={styles.col}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{display}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Pair({ a, b }: { a: React.ReactNode; b?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      {a}
      {b ?? <View style={styles.col} />}
    </View>
  );
}

export function CddDocument({ customer }: { customer: CustomerWithRelations }) {
  const displayName =
    customer.corporateDetail?.namaKorporasi ??
    customer.individualDetail?.namaLengkap ??
    customer.legalArrangementDetail?.nama ??
    "(tanpa nama)";
  const ra = customer.riskAssessment;
  const riskCategory = ra?.riskCategory ?? null;

  return (
    <Document
      title={`CDD - ${displayName}`}
      author="Notary CDD & Risk Assessment"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.subtitle}>
          {`${customerTypeLabels[customer.type]} · ${customerStatusLabels[customer.status]} · Dibuat ${fmtDate(customer.createdAt)}`}
        </Text>

        {riskCategory === "TINGGI" &&
          customer.type === "PERORANGAN" &&
          !customer.highRiskAdditionalInfo && (
            <Text style={styles.bannerRed}>
              Kategori Risiko Tinggi — Informasi Tambahan (EDD) belum diisi.
            </Text>
          )}
        {riskCategory === "TINGGI" && customer.type !== "PERORANGAN" && (
          <Text style={styles.bannerRed}>
            Kategori Risiko Tinggi — form EDD Korporasi/Institusi belum
            tersedia, proses manual diperlukan.
          </Text>
        )}

        {customer.type === "KORPORASI" && customer.corporateDetail && (
          <>
            <Section title="A. Informasi Dasar Pengguna Jasa">
              <Pair
                a={<Item label="Nama Korporasi" value={customer.corporateDetail.namaKorporasi} />}
                b={<Item label="Bentuk Korporasi" value={customer.corporateDetail.bentukKorporasi} />}
              />
              <Pair
                a={<Item label="No. SK Pengesahan" value={customer.corporateDetail.noSkPengesahan} />}
                b={<Item label="Tanggal SK Pengesahan" value={fmtDate(customer.corporateDetail.tanggalSkPengesahan)} />}
              />
              <Pair
                a={<Item label="No. Ijin Usaha" value={customer.corporateDetail.noIjinUsaha} />}
                b={<Item label="Tanggal Ijin Usaha" value={fmtDate(customer.corporateDetail.tanggalIjinUsaha)} />}
              />
              <Pair
                a={<Item label="NPWP" value={customer.corporateDetail.npwp} />}
                b={<Item label="No. Akta Pendirian" value={customer.corporateDetail.noAktaPendirian} />}
              />
              <Pair
                a={<Item label="Nomor Telepon" value={customer.corporateDetail.nomorTelepon} />}
                b={<Item label="Nomor Faksimili" value={customer.corporateDetail.nomorFaksimili} />}
              />
              <Pair a={<Item label="Bidang Usaha" value={customer.corporateDetail.bidangUsaha} />} />
              <Pair a={<Item label="Alamat sesuai Akta" value={customer.corporateDetail.alamatSesuaiAkta} />} />
              <Pair a={<Item label="Alamat Lokasi Usaha" value={customer.corporateDetail.alamatLokasiUsaha} />} />
            </Section>
            <Section title="B. Informasi Kekayaan Korporasi">
              <Pair
                a={<Item label="Sumber Dana" value={customer.corporateDetail.sumberDana} />}
                b={<Item label="Pendapatan Rata-Rata per Tahun" value={customer.corporateDetail.pendapatanRataRata} />}
              />
              <Pair a={<Item label="Tujuan Transaksi" value={customer.corporateDetail.tujuanTransaksi} />} />
            </Section>
          </>
        )}

        {customer.type === "PERORANGAN" && customer.individualDetail && (
          <>
            <Section title="A. Informasi Dasar Pengguna Jasa">
              <Pair
                a={<Item label="Nama Lengkap" value={customer.individualDetail.namaLengkap} />}
                b={<Item label="Nama Alias" value={customer.individualDetail.namaAlias} />}
              />
              <Pair
                a={<Item label="Jenis Identitas" value={jenisIdentitasLabels[customer.individualDetail.jenisIdentitas]} />}
                b={<Item label="No. Identitas" value={customer.individualDetail.noIdentitas} />}
              />
              <Pair
                a={<Item label="NPWP" value={customer.individualDetail.npwp} />}
                b={<Item label="Kewarganegaraan" value={customer.individualDetail.kewarganegaraan} />}
              />
              <Pair
                a={<Item label="Tempat Lahir" value={customer.individualDetail.tempatLahir} />}
                b={<Item label="Tanggal Lahir" value={fmtDate(customer.individualDetail.tanggalLahir)} />}
              />
              <Pair
                a={<Item label="Jenis Kelamin" value={jenisKelaminLabels[customer.individualDetail.jenisKelamin]} />}
                b={
                  <Item
                    label="Status Pernikahan"
                    value={
                      statusPernikahanLabels[customer.individualDetail.statusPernikahan] +
                      (customer.individualDetail.statusPernikahan === "LAINNYA" && customer.individualDetail.statusPernikahanLainnya
                        ? ` (${customer.individualDetail.statusPernikahanLainnya})`
                        : "")
                    }
                  />
                }
              />
              <Pair
                a={<Item label="Nomor Telepon Rumah" value={customer.individualDetail.nomorTeleponRumah} />}
                b={<Item label="Nomor HP" value={customer.individualDetail.nomorHp} />}
              />
              <Pair a={<Item label="Alamat Tempat Tinggal" value={customer.individualDetail.alamatTempatTinggal} />} />
              <Pair a={<Item label="Alamat Domisili" value={customer.individualDetail.alamatDomisili} />} />
              <Pair a={<Item label="Alamat di Negara Asal" value={customer.individualDetail.alamatNegaraAsal} />} />
            </Section>
            <Section title="B. Informasi Pekerjaan dan Sumber Pendapatan">
              <Pair
                a={
                  <Item
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
                }
                b={<Item label="Bidang Usaha" value={customer.individualDetail.bidangUsaha} />}
              />
              <Pair
                a={<Item label="Nama Kantor" value={customer.individualDetail.namaKantor} />}
                b={<Item label="Nomor Telepon Kantor" value={customer.individualDetail.nomorTeleponKantor} />}
              />
              <Pair
                a={<Item label="Jabatan" value={customer.individualDetail.jabatan} />}
                b={
                  <Item
                    label="Pendapatan Rata-Rata per Tahun"
                    value={
                      customer.individualDetail.pendapatanRataRata
                        ? pendapatanRangeLabels[customer.individualDetail.pendapatanRataRata]
                        : null
                    }
                  />
                }
              />
              <Pair a={<Item label="Alamat Kantor" value={customer.individualDetail.alamatKantor} />} />
              <Pair a={<Item label="Tujuan Transaksi" value={customer.individualDetail.tujuanTransaksi} />} />
            </Section>
          </>
        )}

        {customer.type === "LEGAL_ARRANGEMENT" && customer.legalArrangementDetail && (
          <>
            <Section title="A. Informasi Dasar Pengguna Jasa">
              <Pair
                a={<Item label="Nama" value={customer.legalArrangementDetail.nama} />}
                b={
                  <Item
                    label="Jenis Identitas"
                    value={customer.legalArrangementDetail.jenisIdentitas ? jenisIdentitasLabels[customer.legalArrangementDetail.jenisIdentitas] : null}
                  />
                }
              />
              <Pair
                a={<Item label="No. Identitas" value={customer.legalArrangementDetail.noIdentitas} />}
                b={<Item label="NPWP" value={customer.legalArrangementDetail.npwp} />}
              />
              <Pair
                a={<Item label="No. SK Pengesahan" value={customer.legalArrangementDetail.noSkPengesahan} />}
                b={<Item label="Tanggal SK Pengesahan" value={fmtDate(customer.legalArrangementDetail.tanggalSkPengesahan)} />}
              />
              <Pair
                a={<Item label="No. Ijin Usaha" value={customer.legalArrangementDetail.noIjinUsaha} />}
                b={<Item label="Tanggal Ijin Usaha" value={fmtDate(customer.legalArrangementDetail.tanggalIjinUsaha)} />}
              />
              <Pair
                a={<Item label="Nomor Telepon" value={customer.legalArrangementDetail.nomorTelepon} />}
                b={<Item label="Nomor Faksimili" value={customer.legalArrangementDetail.nomorFaksimili} />}
              />
              <Pair
                a={<Item label="Bidang Usaha" value={customer.legalArrangementDetail.bidangUsaha} />}
                b={<Item label="No. Akta Pendirian" value={customer.legalArrangementDetail.noAktaPendirian} />}
              />
              <Pair a={<Item label="Alamat" value={customer.legalArrangementDetail.alamat} />} />
            </Section>
            <Section title="B. Informasi Kekayaan">
              <Pair
                a={<Item label="Sumber Dana" value={customer.legalArrangementDetail.sumberDana} />}
                b={<Item label="Pendapatan Rata-Rata per Tahun" value={customer.legalArrangementDetail.pendapatanRataRata} />}
              />
              <Pair a={<Item label="Tujuan Transaksi" value={customer.legalArrangementDetail.tujuanTransaksi} />} />
            </Section>
          </>
        )}

        <Section title={`Informasi Pemilik Manfaat (Beneficial Owner) — ${customer.beneficialOwners.length} orang`}>
          {customer.beneficialOwners.length === 0 && (
            <Text style={styles.value}>Tidak ada Pemilik Manfaat tercatat.</Text>
          )}
          {customer.beneficialOwners.map((bo, i) => (
            <View key={bo.id} style={i > 0 ? styles.subEntry : undefined} wrap={false}>
              <Text style={styles.subEntryTitle}>{`Pemilik Manfaat #${i + 1}`}</Text>
              <Pair
                a={<Item label="Nama Lengkap" value={bo.namaLengkap} />}
                b={<Item label="Nama Alias" value={bo.namaAlias} />}
              />
              <Pair
                a={<Item label="Jenis Identitas" value={bo.jenisIdentitas ? jenisIdentitasLabels[bo.jenisIdentitas] : null} />}
                b={<Item label="No. Identitas" value={bo.noIdentitas} />}
              />
              <Pair
                a={<Item label="Tempat Lahir" value={bo.tempatLahir} />}
                b={<Item label="Tanggal Lahir" value={fmtDate(bo.tanggalLahir)} />}
              />
              <Pair
                a={<Item label="Kewarganegaraan" value={bo.kewarganegaraan} />}
                b={<Item label="NPWP" value={bo.npwp} />}
              />
              <Pair a={<Item label="Alamat Tempat Tinggal" value={bo.alamatTempatTinggal} />} />
              <Pair a={<Item label="Alamat di Negara Asal" value={bo.alamatNegaraAsal} />} />
              <Pair a={<Item label="Hubungan dengan Pengguna Jasa" value={bo.hubunganDenganPenggunaJasa} />} />
            </View>
          ))}
        </Section>

        {customer.type === "KORPORASI" && customer.powerOfAttorney && (
          <Section title="D. Informasi Kuasa Korporasi">
            <Pair
              a={<Item label="Hubungan Hukum Pengguna Jasa" value={hubunganHukumPengurusLabels[customer.powerOfAttorney.hubunganHukum]} />}
              b={<Item label="No. Surat Kuasa" value={customer.powerOfAttorney.noSuratKuasa} />}
            />
            <Pair
              a={<Item label="Tanggal Surat Kuasa" value={fmtDate(customer.powerOfAttorney.tanggalSuratKuasa)} />}
              b={<Item label="Penandatangan Surat Kuasa" value={customer.powerOfAttorney.penandatanganSuratKuasa} />}
            />
            <Pair
              a={<Item label="Jabatan Penandatangan" value={customer.powerOfAttorney.jabatanPenandatangan} />}
              b={<Item label="Nama Lengkap Pengguna Jasa" value={customer.powerOfAttorney.namaLengkapPenggunaJasa} />}
            />
            <Pair
              a={<Item label="Nama Alias" value={customer.powerOfAttorney.namaAlias} />}
              b={
                <Item
                  label="Jenis Identitas Pengguna Jasa"
                  value={customer.powerOfAttorney.jenisIdentitasPenggunaJasa ? jenisIdentitasLabels[customer.powerOfAttorney.jenisIdentitasPenggunaJasa] : null}
                />
              }
            />
            <Pair
              a={<Item label="No. Identitas Pengguna Jasa" value={customer.powerOfAttorney.noIdentitasPenggunaJasa} />}
              b={<Item label="Tempat Lahir" value={customer.powerOfAttorney.tempatLahir} />}
            />
            <Pair
              a={<Item label="Tanggal Lahir" value={fmtDate(customer.powerOfAttorney.tanggalLahir)} />}
              b={<Item label="Kewarganegaraan" value={customer.powerOfAttorney.kewarganegaraan} />}
            />
            <Pair a={<Item label="Alamat Tempat Tinggal" value={customer.powerOfAttorney.alamatTempatTinggal} />} />
          </Section>
        )}

        {customer.type === "LEGAL_ARRANGEMENT" && (
          <Section title={`D. Informasi Pihak dalam Legal Arrangement — ${customer.legalArrangementParties.length} pihak`}>
            {customer.legalArrangementParties.length === 0 && (
              <Text style={styles.value}>Tidak ada pihak tercatat.</Text>
            )}
            {customer.legalArrangementParties.map((party, i) => (
              <View key={party.id} style={i > 0 ? styles.subEntry : undefined} wrap={false}>
                <Text style={styles.subEntryTitle}>{`Pihak #${i + 1}`}</Text>
                <Pair
                  a={<Item label="Nama Lengkap" value={party.namaLengkap} />}
                  b={<Item label="Nama Alias" value={party.namaAlias} />}
                />
                <Pair
                  a={<Item label="Jenis Identitas" value={party.jenisIdentitas ? jenisIdentitasLabels[party.jenisIdentitas] : null} />}
                  b={<Item label="No. Identitas" value={party.noIdentitas} />}
                />
                <Pair
                  a={<Item label="Tempat Lahir" value={party.tempatLahir} />}
                  b={<Item label="Tanggal Lahir" value={fmtDate(party.tanggalLahir)} />}
                />
                <Pair
                  a={<Item label="Kewarganegaraan" value={party.kewarganegaraan} />}
                  b={<Item label="Hubungan Hukum Pengguna Jasa" value={party.hubunganHukumPenggunaJasa} />}
                />
                <Pair
                  a={<Item label="No. Perjanjian" value={party.noPerjanjian} />}
                  b={<Item label="Tanggal Perjanjian" value={fmtDate(party.tanggalPerjanjian)} />}
                />
                <Pair a={<Item label="Alamat Tempat Tinggal" value={party.alamatTempatTinggal} />} />
                <Pair a={<Item label="Penandatanganan Perjanjian" value={party.penandatangananPerjanjian} />} />
              </View>
            ))}
          </Section>
        )}

        {customer.notaryService && (
          <Section title="Informasi Jasa yang Diberikan">
            <Pair
              a={<Item label="Nama Notaris" value={customer.notaryService.namaNotaris} />}
              b={<Item label="Jasa yang Diberikan" value={customer.notaryService.jasaYangDiberikan} />}
            />
          </Section>
        )}

        <Section title="Risk Assessment — Analisa PEP & Skoring">
          <Pair
            a={<Item label="Apakah Pengguna Jasa adalah PEP?" value={yesNo(ra?.isPep)} />}
            b={<Item label="Nama Lengkap PEP" value={ra?.namaLengkapPep} />}
          />
          <Pair
            a={<Item label="PEP Lokal atau Asing" value={ra?.pepAsalNegara ? pepAsalNegaraLabels[ra.pepAsalNegara] : null} />}
            b={<Item label="Warga Negara PEP" value={ra?.wargaNegaraPep} />}
          />
          <Pair
            a={<Item label="Ada Berita Negatif Terkait PEP" value={yesNo(ra?.adaBeritaNegatif)} />}
            b={<Item label="Jabatan PEP" value={ra?.jabatanPep ? pepJabatanLabels[ra.jabatanPep] : null} />}
          />
          <Pair a={<Item label="Hubungan dengan PEP" value={ra?.hubunganDenganPep ? pepHubunganLabels[ra.hubunganDenganPep] : null} />} />
          <Pair
            a={<Item label="Profil Pengguna Jasa dan/atau BO" value={ra?.userProfileScore ? `${ra.userProfileScore.categoryName} (${ra.userProfileScore.score})` : null} />}
            b={
              <Item
                label="Profil Bisnis Pengguna Jasa dan/atau BO"
                value={
                  ra?.businessSectorScore
                    ? `${ra.businessSectorScore.categoryName}${ra.businessSectorScore.score != null ? ` (${ra.businessSectorScore.score})` : ""}`
                    : null
                }
              />
            }
          />
          <Pair
            a={<Item label="Profil Wilayah Pengguna Jasa dan/atau BO" value={ra?.regionScore ? `${ra.regionScore.categoryName} (${ra.regionScore.score})` : null} />}
            b={<Item label="Profil Negara Asal Pengguna Jasa dan/atau BO" value={ra?.countryScore ? `${ra.countryScore.categoryName} (${ra.countryScore.score})` : null} />}
          />
          <Pair
            a={<Item label="Profil Jasa yang Diberikan oleh Notaris" value={ra?.notaryServiceTypeScore ? `${ra.notaryServiceTypeScore.categoryName} (${ra.notaryServiceTypeScore.score})` : null} />}
            b={<Item label="Total Nilai" value={ra?.totalScore ?? "Belum final"} />}
          />
          <Pair a={<Item label="Kategori Risiko" value={riskCategory ? riskCategoryLabels[riskCategory] : "Belum final"} />} />
        </Section>

        {customer.highRiskAdditionalInfo && (
          <Section title="Informasi Tambahan — Berisiko Tinggi (EDD)">
            <Pair
              a={<Item label="Nama Lengkap" value={customer.highRiskAdditionalInfo.namaLengkap} />}
              b={
                <Item
                  label="Jenis Identitas"
                  value={customer.highRiskAdditionalInfo.jenisIdentitas ? jenisIdentitasEddLabels[customer.highRiskAdditionalInfo.jenisIdentitas] : null}
                />
              }
            />
            <Pair
              a={<Item label="Nomor Identitas" value={customer.highRiskAdditionalInfo.nomorIdentitas} />}
              b={<Item label="Tempat/Tanggal Lahir" value={[customer.highRiskAdditionalInfo.tempatLahir, fmtDate(customer.highRiskAdditionalInfo.tanggalLahir)].filter(Boolean).join(", ")} />}
            />
            <Pair
              a={
                <Item
                  label="Jenis High Risk Customer"
                  value={customer.highRiskAdditionalInfo.jenisHighRiskCustomer ? jenisHighRiskCustomerLabels[customer.highRiskAdditionalInfo.jenisHighRiskCustomer] : null}
                />
              }
              b={<Item label="Metode Pembayaran" value={customer.highRiskAdditionalInfo.metodePembayaran} />}
            />
            <Pair
              a={<Item label="Nama Perusahaan Tempat Bekerja" value={customer.highRiskAdditionalInfo.namaPerusahaanTempatBekerja} />}
              b={
                <Item
                  label="Jumlah Penghasilan per Bulan"
                  value={customer.highRiskAdditionalInfo.jumlahPenghasilanPerBulan ? penghasilanBulananEddLabels[customer.highRiskAdditionalInfo.jumlahPenghasilanPerBulan] : null}
                />
              }
            />
            <Pair
              a={
                <Item
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
              }
              b={
                <Item
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
              }
            />
            <Pair a={<Item label="Alamat Sesuai Identitas" value={customer.highRiskAdditionalInfo.alamatSesuaiIdentitas} />} />
          </Section>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Dicetak ${new Date().toLocaleString("id-ID")} · Halaman ${pageNumber} dari ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
