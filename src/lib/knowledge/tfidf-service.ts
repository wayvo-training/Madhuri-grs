import natural from "natural";
import { cosineSimilarity } from "./cosine-similarity";
import { tokenizeAndStem } from "./text-preprocessor";

export interface TfIdfVectorPair {
  vectorA: Map<string, number>;
  vectorB: Map<string, number>;
}

/**
 * Extracts term features from preprocessed text for TF-IDF:
 * - Stem unigrams
 * - Stem bigrams (captures phrase context e.g., "annual leave", "policy update")
 * - Character 3-grams of stems (captures morphological alignment e.g., "correct" / "incorrect")
 */
export function extractTfIdfFeatures(text?: string | null): string[] {
  const stems = tokenizeAndStem(text);
  if (stems.length === 0) {
    return [];
  }

  const features: string[] = [...stems];

  // Stem Bigrams
  for (let i = 0; i < stems.length - 1; i++) {
    features.push(`bg_${stems[i]}_${stems[i + 1]}`);
  }

  // Character 3-grams of stems for morphological overlap
  for (const s of stems) {
    if (s.length >= 3) {
      for (let i = 0; i <= s.length - 3; i++) {
        features.push(`cg_${s.slice(i, i + 3)}`);
      }
    }
  }

  return features;
}

/**
 * Builds TF-IDF vector representations for two documents using Natural's TfIdf.
 */
export function createTfIdfVectors(
  textA?: string | null,
  textB?: string | null,
): TfIdfVectorPair {
  const featuresA = extractTfIdfFeatures(textA);
  const featuresB = extractTfIdfFeatures(textB);

  const vectorA = new Map<string, number>();
  const vectorB = new Map<string, number>();

  if (featuresA.length === 0 || featuresB.length === 0) {
    return { vectorA, vectorB };
  }

  const tfidf = new natural.TfIdf();
  tfidf.addDocument(featuresA);
  tfidf.addDocument(featuresB);

  tfidf.listTerms(0).forEach((item) => {
    vectorA.set(item.term, item.tfidf);
  });

  tfidf.listTerms(1).forEach((item) => {
    vectorB.set(item.term, item.tfidf);
  });

  return { vectorA, vectorB };
}

/**
 * Computes a normalized similarity score (0..100) between two text fields:
 * 1. Preprocesses text and extracts features.
 * 2. Builds TF-IDF vectors using Natural.
 * 3. Calculates cosine similarity of the vectors.
 * 4. Combines with term containment and overlap for robust short-text duplicate detection.
 * 5. Returns a deterministic percentage between 0 and 100.
 */
export function calculateFieldSimilarity(
  textA?: string | null,
  textB?: string | null,
): number {
  const stemsA = tokenizeAndStem(textA);
  const stemsB = tokenizeAndStem(textB);

  if (stemsA.length === 0 || stemsB.length === 0) {
    return 0;
  }

  // Fast path for exact normalized identical match
  if (stemsA.join(" ") === stemsB.join(" ")) {
    return 100;
  }

  // 1. TF-IDF Cosine Similarity using Natural
  const { vectorA, vectorB } = createTfIdfVectors(textA, textB);
  const rawCosine = cosineSimilarity(vectorA, vectorB);

  // 2. Keyword Containment & Jaccard overlap on word stems
  const setA = new Set(stemsA);
  const setB = new Set(stemsB);

  let sharedCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      sharedCount++;
    }
  }

  if (sharedCount === 0 && rawCosine <= 0) {
    return 0;
  }

  const minLen = Math.min(setA.size, setB.size);
  const unionSize = new Set([...stemsA, ...stemsB]).size;

  const containment = minLen > 0 ? sharedCount / minLen : 0;
  const jaccard = unionSize > 0 ? sharedCount / unionSize : 0;

  // Composite signal: cosine (30%), containment (50%), jaccard (20%)
  const composite = rawCosine * 0.3 + containment * 0.5 + jaccard * 0.2;
  if (composite <= 0) return 0;
  if (composite >= 0.999) return 100;

  // Domain calibration: 50%-70% term overlap represents 75%-88% similarity in knowledge articles
  const calibrated = Math.min(100, composite ** 0.28 * 100);
  return Math.round(calibrated * 100) / 100;
}
