import natural from "natural";

const tokenizer = new natural.WordTokenizer();
const stopWordsSet = new Set(
  (natural.stopwords || []).map((w: string) => w.toLowerCase()),
);

/**
 * Preprocesses and normalizes text for NLP similarity calculations:
 * - Converts to lowercase
 * - Strips punctuation and non-alphanumeric symbols
 * - Tokenizes words
 * - Removes standard stop words
 * - Applies Porter stemming deterministically
 * - Strips excessive whitespace
 *
 * Does not modify original database records.
 */
export function preprocessText(text?: string | null): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // 1. Lowercase
  const lower = text.toLowerCase();

  // 2. Remove punctuation / symbols
  const cleaned = lower.replace(/[^\w\s]/g, " ");

  // 3. Tokenize
  const rawTokens = tokenizer.tokenize(cleaned) || [];

  // 4. Filter stop words & 1-character noise
  const filtered = rawTokens.filter((token) => {
    const t = token.trim();
    return t.length > 1 && !stopWordsSet.has(t);
  });

  // 5. Porter stemming
  const stemmed = filtered.map((token) => natural.PorterStemmer.stem(token));

  // 6. Return single-space joined terms
  return stemmed.join(" ").trim();
}

/**
 * Returns preprocessed stemmed tokens as an array of strings.
 */
export function tokenizeAndStem(text?: string | null): string[] {
  const processed = preprocessText(text);
  return processed ? processed.split(/\s+/) : [];
}
