export type Vector = Map<string, number> | Record<string, number>;

/**
 * Calculates cosine similarity between two TF-IDF vectors.
 *
 * Input:
 * - TF-IDF vector A
 * - TF-IDF vector B
 *
 * Output:
 * - similarity value between 0 and 1
 *
 * Handles edge cases safely:
 * - Empty vectors -> 0
 * - No common terms -> 0
 * - Zero magnitude vectors -> 0
 *
 * Returns 0 similarity for invalid/empty comparisons rather than throwing an error.
 */
export function cosineSimilarity(
  vecA?: Vector | null,
  vecB?: Vector | null,
): number {
  if (!vecA || !vecB) {
    return 0;
  }

  const mapA = vecA instanceof Map ? vecA : new Map(Object.entries(vecA));
  const mapB = vecB instanceof Map ? vecB : new Map(Object.entries(vecB));

  if (mapA.size === 0 || mapB.size === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeASq = 0;
  let magnitudeBSq = 0;

  for (const [, valA] of mapA.entries()) {
    if (typeof valA === "number" && !Number.isNaN(valA)) {
      magnitudeASq += valA * valA;
    }
  }

  for (const [, valB] of mapB.entries()) {
    if (typeof valB === "number" && !Number.isNaN(valB)) {
      magnitudeBSq += valB * valB;
    }
  }

  if (magnitudeASq <= 0 || magnitudeBSq <= 0) {
    return 0;
  }

  // Iterate over smaller map for efficiency
  const [smaller, larger] =
    mapA.size <= mapB.size ? [mapA, mapB] : [mapB, mapA];

  for (const [key, val] of smaller.entries()) {
    if (typeof val === "number" && !Number.isNaN(val)) {
      const otherVal = larger.get(key);
      if (typeof otherVal === "number" && !Number.isNaN(otherVal)) {
        dotProduct += val * otherVal;
      }
    }
  }

  if (dotProduct <= 0) {
    return 0;
  }

  const denominator = Math.sqrt(magnitudeASq) * Math.sqrt(magnitudeBSq);
  if (denominator <= 0) {
    return 0;
  }

  const similarity = dotProduct / denominator;
  return Math.min(1, Math.max(0, similarity));
}

/**
 * Converts a 0..1 similarity value to percentage:
 * similarityPercentage = similarity * 100
 *
 * Example: 0.91 -> 91
 */
export function toSimilarityPercentage(similarity: number): number {
  if (Number.isNaN(similarity) || similarity <= 0) {
    return 0;
  }
  if (similarity >= 1) {
    return 100;
  }
  return Math.round(similarity * 10000) / 100;
}
