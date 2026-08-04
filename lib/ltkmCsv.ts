// FR-8 — pembuatan string CSV untuk export laporan LTKM
// (app/api/ltkm-export/route.ts). Dipisah jadi fungsi murni supaya bisa
// dites langsung tanpa lewat route handler (lihat quoting/escaping RFC 4180).

export type LtkmExportRow = {
  nama: string;
  tipe: string;
  kategoriRisiko: string;
  status: string;
  tanggalDitandai: string;
  catatan: string;
};

const LTKM_CSV_HEADER = [
  "Nama",
  "Tipe",
  "Kategori Risiko",
  "Status",
  "Tanggal Ditandai",
  "Catatan",
];

/** Bungkus tiap field dalam tanda kutip ganda, dobelkan tanda kutip internal (RFC 4180). */
function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildLtkmCsv(rows: LtkmExportRow[]): string {
  const lines = [
    LTKM_CSV_HEADER,
    ...rows.map((r) => [
      r.nama,
      r.tipe,
      r.kategoriRisiko,
      r.status,
      r.tanggalDitandai,
      r.catatan,
    ]),
  ].map((cols) => cols.map(csvField).join(","));

  return lines.join("\r\n");
}
