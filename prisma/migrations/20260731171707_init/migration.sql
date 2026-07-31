-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CorporateDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "namaKorporasi" TEXT NOT NULL,
    "bentukKorporasi" TEXT,
    "noSkPengesahan" TEXT,
    "tanggalSkPengesahan" DATETIME,
    "noIjinUsaha" TEXT,
    "tanggalIjinUsaha" DATETIME,
    "npwp" TEXT,
    "alamatSesuaiAkta" TEXT,
    "alamatLokasiUsaha" TEXT,
    "nomorTelepon" TEXT,
    "nomorFaksimili" TEXT,
    "bidangUsaha" TEXT,
    "noAktaPendirian" TEXT,
    "sumberDana" TEXT,
    "pendapatanRataRata" TEXT,
    "tujuanTransaksi" TEXT,
    CONSTRAINT "CorporateDetail_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IndividualDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "namaAlias" TEXT,
    "jenisIdentitas" TEXT NOT NULL,
    "noIdentitas" TEXT,
    "npwp" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" DATETIME,
    "kewarganegaraan" TEXT,
    "alamatTempatTinggal" TEXT,
    "alamatDomisili" TEXT,
    "alamatNegaraAsal" TEXT,
    "nomorTeleponRumah" TEXT,
    "nomorHp" TEXT,
    "jenisKelamin" TEXT NOT NULL,
    "statusPernikahan" TEXT NOT NULL,
    "statusPernikahanLainnya" TEXT,
    "sumberPendapatan" TEXT,
    "sumberPendapatanLainnya" TEXT,
    "bidangUsaha" TEXT,
    "namaKantor" TEXT,
    "alamatKantor" TEXT,
    "nomorTeleponKantor" TEXT,
    "jabatan" TEXT,
    "pendapatanRataRata" TEXT,
    "tujuanTransaksi" TEXT,
    CONSTRAINT "IndividualDetail_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LegalArrangementDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenisIdentitas" TEXT,
    "noIdentitas" TEXT,
    "noSkPengesahan" TEXT,
    "tanggalSkPengesahan" DATETIME,
    "noIjinUsaha" TEXT,
    "tanggalIjinUsaha" DATETIME,
    "npwp" TEXT,
    "alamat" TEXT,
    "nomorTelepon" TEXT,
    "nomorFaksimili" TEXT,
    "bidangUsaha" TEXT,
    "noAktaPendirian" TEXT,
    "sumberDana" TEXT,
    "pendapatanRataRata" TEXT,
    "tujuanTransaksi" TEXT,
    CONSTRAINT "LegalArrangementDetail_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BeneficialOwner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "namaAlias" TEXT,
    "jenisIdentitas" TEXT,
    "noIdentitas" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" DATETIME,
    "kewarganegaraan" TEXT,
    "alamatTempatTinggal" TEXT,
    "alamatNegaraAsal" TEXT,
    "npwp" TEXT,
    "hubunganDenganPenggunaJasa" TEXT,
    CONSTRAINT "BeneficialOwner_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PowerOfAttorney" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "hubunganHukum" TEXT NOT NULL,
    "noSuratKuasa" TEXT,
    "tanggalSuratKuasa" DATETIME,
    "penandatanganSuratKuasa" TEXT,
    "jabatanPenandatangan" TEXT,
    "namaLengkapPenggunaJasa" TEXT,
    "namaAlias" TEXT,
    "jenisIdentitasPenggunaJasa" TEXT,
    "noIdentitasPenggunaJasa" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" DATETIME,
    "kewarganegaraan" TEXT,
    "alamatTempatTinggal" TEXT,
    CONSTRAINT "PowerOfAttorney_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LegalArrangementParty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "namaAlias" TEXT,
    "jenisIdentitas" TEXT,
    "noIdentitas" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" DATETIME,
    "kewarganegaraan" TEXT,
    "alamatTempatTinggal" TEXT,
    "hubunganHukumPenggunaJasa" TEXT,
    "noPerjanjian" TEXT,
    "tanggalPerjanjian" DATETIME,
    "penandatangananPerjanjian" TEXT,
    CONSTRAINT "LegalArrangementParty_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotaryService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "namaNotaris" TEXT,
    "jasaYangDiberikan" TEXT,
    CONSTRAINT "NotaryService_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "isPep" BOOLEAN,
    "namaLengkapPep" TEXT,
    "pepAsalNegara" TEXT,
    "wargaNegaraPep" TEXT,
    "adaBeritaNegatif" BOOLEAN,
    "jabatanPep" TEXT,
    "hubunganDenganPep" TEXT,
    "userProfileScoreId" TEXT,
    "businessSectorScoreId" TEXT,
    "regionScoreId" TEXT,
    "countryScoreId" TEXT,
    "notaryServiceTypeScoreId" TEXT,
    "totalScore" INTEGER,
    "riskCategory" TEXT,
    CONSTRAINT "RiskAssessment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RiskAssessment_userProfileScoreId_fkey" FOREIGN KEY ("userProfileScoreId") REFERENCES "RefUserProfileScore" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskAssessment_businessSectorScoreId_fkey" FOREIGN KEY ("businessSectorScoreId") REFERENCES "RefBusinessSectorScore" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskAssessment_regionScoreId_fkey" FOREIGN KEY ("regionScoreId") REFERENCES "RefRegionScore" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskAssessment_countryScoreId_fkey" FOREIGN KEY ("countryScoreId") REFERENCES "RefCountryScore" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskAssessment_notaryServiceTypeScoreId_fkey" FOREIGN KEY ("notaryServiceTypeScoreId") REFERENCES "RefNotaryServiceTypeScore" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HighRiskAdditionalInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "namaLengkap" TEXT,
    "jenisIdentitas" TEXT,
    "nomorIdentitas" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" DATETIME,
    "alamatSesuaiIdentitas" TEXT,
    "jenisHighRiskCustomer" TEXT,
    "metodePembayaran" TEXT,
    "tujuanTransaksi" TEXT,
    "tujuanTransaksiLainnya" TEXT,
    "sumberKekayaan" TEXT,
    "sumberKekayaanLainnya" TEXT,
    "namaPerusahaanTempatBekerja" TEXT,
    "jumlahPenghasilanPerBulan" TEXT,
    CONSTRAINT "HighRiskAdditionalInfo_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefUserProfileScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RefBusinessSectorScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryName" TEXT NOT NULL,
    "score" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RefRegionScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RefCountryScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RefNotaryServiceTypeScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "CorporateDetail_customerId_key" ON "CorporateDetail"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualDetail_customerId_key" ON "IndividualDetail"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalArrangementDetail_customerId_key" ON "LegalArrangementDetail"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PowerOfAttorney_customerId_key" ON "PowerOfAttorney"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "NotaryService_customerId_key" ON "NotaryService"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_customerId_key" ON "RiskAssessment"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "HighRiskAdditionalInfo_customerId_key" ON "HighRiskAdditionalInfo"("customerId");
