import { SUPABASE_BUCKET, supabaseAdmin } from "@/lib/supabase";

// In-memory cache for extracted text to prevent redundant downloads/extractions
const textExtractionCache = new Map<string, string>();

/**
 * Extracts plain text from a file buffer (PDF, TXT, CSV, JSON, Markdown, HTML, XML, DOCX).
 * Returns empty string if file format is binary or extraction fails.
 */
export async function extractTextFromFileBuffer(
  buffer: Buffer,
  fileType = "",
  fileName = "",
): Promise<string> {
  const lowerName = fileName.toLowerCase();
  const lowerType = fileType.toLowerCase();

  // 1. Text-based files (txt, csv, tsv, json, md, log, html, xml)
  if (
    lowerType.startsWith("text/") ||
    lowerType.includes("json") ||
    lowerType.includes("csv") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".tsv") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".log")
  ) {
    try {
      const rawText = buffer.toString("utf-8");
      return cleanExtractedText(rawText);
    } catch {
      return "";
    }
  }

  // 2. PDF Documents
  if (lowerType.includes("pdf") || lowerName.endsWith(".pdf")) {
    try {
      // Dynamic import of pdf-parse to avoid overhead when not parsing PDFs
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        if (result && typeof result.text === "string") {
          return cleanExtractedText(result.text);
        }
      } finally {
        await parser.destroy().catch(() => {});
      }
    } catch (err) {
      console.warn(
        `[TextExtractor] PDF extraction failed for ${fileName}:`,
        err,
      );
    }
    return "";
  }

  // 3. Word Documents (.docx)
  if (lowerName.endsWith(".docx") || lowerType.includes("wordprocessingml")) {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const documentXmlFile = zip.file("word/document.xml");
      if (documentXmlFile) {
        const xmlContent = await documentXmlFile.async("string");
        if (xmlContent) {
          const stripped = xmlContent.replace(/<[^>]+>/g, " ");
          return cleanExtractedText(stripped);
        }
      }
    } catch (err) {
      console.warn(
        `[TextExtractor] DOCX extraction failed for ${fileName}:`,
        err,
      );
    }
    return "";
  }

  // 4. Simple text extraction for XML/HTML embedded in buffers
  if (lowerType.includes("xml") || lowerName.endsWith(".xml")) {
    try {
      const xmlStr = buffer.toString("utf-8");
      const stripped = xmlStr.replace(/<[^>]+>/g, " ");
      return cleanExtractedText(stripped);
    } catch {
      return "";
    }
  }

  return "";
}

/**
 * Downloads a file from Supabase Storage and extracts its textual content.
 * Results are cached in-memory by storage path.
 */
export async function extractTextFromStorage(
  storagePath: string,
  fileType = "",
  fileName = "",
): Promise<string> {
  if (!storagePath) return "";

  const cacheKey = `${storagePath}:${fileName}`;
  if (textExtractionCache.has(cacheKey)) {
    return textExtractionCache.get(cacheKey) || "";
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .download(storagePath);

    if (error || !data) {
      return "";
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extracted = await extractTextFromFileBuffer(
      buffer,
      fileType,
      fileName,
    );

    // Keep cache bounded to 200 items to avoid excessive memory usage
    if (textExtractionCache.size > 200) {
      const firstKey = textExtractionCache.keys().next().value;
      if (firstKey) textExtractionCache.delete(firstKey);
    }

    textExtractionCache.set(cacheKey, extracted);
    return extracted;
  } catch (err) {
    console.warn(
      `[TextExtractor] Failed to extract from storage ${storagePath}:`,
      err,
    );
    return "";
  }
}

/**
 * Normalizes and cleans extracted text: strips excessive whitespace and caps at 50k chars.
 */
function cleanExtractedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 50000);
}
