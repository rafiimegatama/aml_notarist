// Dipisah dari lib/actions/knowledgeBase.ts ("use server") karena file
// server action HANYA boleh mengekspor async function — const/type biasa
// harus tinggal di modul terpisah supaya bisa diimpor client component juga.
export const SOURCE_TYPES = [
  "PPATK",
  "UU_TPPU",
  "SOP_INTERNAL",
  "CDD_GUIDELINE",
  "EDD_GUIDELINE",
  "UPLOADED_REGULATION",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
