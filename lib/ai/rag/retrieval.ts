import { prisma } from "@/lib/prisma";

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sectionLabel: string | null;
  pageLabel: string | null;
  content: string;
  score: number;
}

// Stopword Indonesia + Inggris minimal — cukup untuk mengurangi noise kata
// fungsi umum ("yang", "dan", "the", "of") tanpa perlu kamus lengkap.
const STOPWORDS = new Set([
  "yang", "dan", "atau", "di", "ke", "dari", "untuk", "pada", "dengan",
  "adalah", "ini", "itu", "akan", "dapat", "harus", "tidak", "juga",
  "the", "of", "and", "or", "to", "in", "a", "is", "for", "on", "with",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9à-ɏ\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function termFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

// BM25 — konstanta standar (k1=1.5, b=0.75). Dihitung penuh saat query
// (bukan precomputed index) karena korpus regulasi kantor notaris realistis
// berukuran puluhan-ratusan chunk, bukan jutaan — biaya ini dapat diabaikan
// dan menghindari kebutuhan index terpisah yang bisa basi.
const K1 = 1.5;
const B = 0.75;

/**
 * Retrieval murni lexical (BM25) — TIDAK memakai embedding/vector DB
 * eksternal apa pun, supaya AI Compliance Assistant tetap bisa jalan
 * offline (mode Local) dan hasil retrieval-nya bisa diperiksa manusia
 * (kecocokan kata, bukan kemiripan vektor black-box). Mengembalikan array
 * kosong kalau tidak ada chunk yang cukup relevan — pemanggil (lib/ai/
 * services/compliance.ts) WAJIB menolak menjawab kalau ini kosong, bukan
 * mengarang jawaban dari memori model.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK = 5,
  minScore = 0.05
): Promise<RetrievedChunk[]> {
  const chunks = await prisma.knowledgeChunk.findMany({
    include: { document: { select: { title: true } } },
  });
  if (chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const docTokens = chunks.map((c) => tokenize(c.content));
  const docLengths = docTokens.map((t) => t.length);
  const avgDocLength = docLengths.reduce((a, b) => a + b, 0) / docLengths.length || 1;

  const docFreq = new Map<string, number>();
  for (const term of new Set(queryTokens)) {
    let count = 0;
    for (const tokens of docTokens) {
      if (tokens.includes(term)) count++;
    }
    docFreq.set(term, count);
  }

  const N = chunks.length;
  const scores = chunks.map((chunk, i) => {
    const tf = termFrequencies(docTokens[i]);
    const docLength = docLengths[i];
    let score = 0;
    for (const term of queryTokens) {
      const df = docFreq.get(term) ?? 0;
      if (df === 0) continue;
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
      const f = tf.get(term) ?? 0;
      const numerator = f * (K1 + 1);
      const denominator = f + K1 * (1 - B + B * (docLength / avgDocLength));
      score += idf * (numerator / (denominator || 1));
    }
    return score;
  });

  const maxScore = Math.max(...scores, 1);
  return chunks
    .map((chunk, i) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.document.title,
      sectionLabel: chunk.sectionLabel,
      pageLabel: chunk.pageLabel,
      content: chunk.content,
      score: scores[i] / maxScore, // dinormalisasi 0-1 supaya minScore konsisten lintas query
    }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
