export interface RawChunk {
  content: string;
  sectionLabel: string | null;
  pageLabel: string | null;
}

const TARGET_CHUNK_CHARS = 900;
const MIN_CHUNK_CHARS = 80;

// Regulasi/SOP Indonesia biasanya berstruktur "Pasal 5", "Bagian 5.3",
// "Section 5.3" — kalau ditemukan, dipakai sebagai sectionLabel per chunk
// supaya sitasi ("PPATK Guideline 2024, Section 5.3") bisa ditampilkan tanpa
// notaris harus menandai manual tiap paragraf.
const SECTION_HEADER_RE = /^(pasal\s+\d+[a-z]?|bagian\s+[\d.]+|section\s+[\d.]+|bab\s+[ivxlcdm]+)/i;

/**
 * Memecah teks regulasi mentah jadi potongan siap-retrieval. Split di batas
 * paragraf dulu (baris kosong), lalu digabung sampai mendekati
 * TARGET_CHUNK_CHARS supaya konteks tidak terlalu terpotong-potong untuk
 * LLM, tapi juga tidak terlalu panjang untuk retrieval lexical yang presisi.
 */
export function chunkRegulationText(rawText: string): RawChunk[] {
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: RawChunk[] = [];
  let buffer = "";
  let currentSection: string | null = null;

  function flush() {
    const trimmed = buffer.trim();
    if (trimmed.length >= MIN_CHUNK_CHARS) {
      chunks.push({ content: trimmed, sectionLabel: currentSection, pageLabel: null });
    } else if (trimmed.length > 0 && chunks.length > 0) {
      // Sisa terlalu pendek untuk jadi chunk sendiri — gabung ke chunk terakhir.
      chunks[chunks.length - 1].content += "\n\n" + trimmed;
    }
    buffer = "";
  }

  for (const para of paragraphs) {
    const headerMatch = para.match(SECTION_HEADER_RE);
    if (headerMatch) {
      flush();
      currentSection = para.slice(0, 60).split("\n")[0].trim();
    }
    if (buffer.length + para.length > TARGET_CHUNK_CHARS && buffer.length > 0) {
      flush();
    }
    buffer += (buffer ? "\n\n" : "") + para;
  }
  flush();

  return chunks;
}
