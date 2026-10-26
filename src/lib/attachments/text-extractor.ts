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
      const zlib = await import("node:zlib");
      let offset = 0;
      while (offset < buffer.length - 30) {
        if (
          buffer[offset] === 0x50 &&
          buffer[offset + 1] === 0x4b &&
          buffer[offset + 2] === 0x03 &&
          buffer[offset + 3] === 0x04
        ) {
          const compressionMethod = buffer.readUInt16LE(offset + 8);
          const compressedSize = buffer.readUInt32LE(offset + 18);
          const fileNameLength = buffer.readUInt16LE(offset + 26);
          const extraFieldLength = buffer.readUInt16LE(offset + 28);
          const zipEntryName = buffer.toString(
            "utf-8",
            offset + 30,
            offset + 30 + fileNameLength,
          );
          const dataOffset = offset + 30 + fileNameLength + extraFieldLength;

          if (zipEntryName === "word/document.xml") {
            const compressedData = buffer.subarray(
              dataOffset,
              dataOffset + compressedSize,
            );
            let xmlContent = "";
            if (compressionMethod === 8) {
              xmlContent = zlib
                .inflateRawSync(compressedData)
                .toString("utf-8");
            } else if (compressionMethod === 0) {
              xmlContent = compressedData.toString("utf-8");
            }
            if (xmlContent) {
              const stripped = xmlContent.replace(/<[^>]+>/g, " ");
              return cleanExtractedText(stripped);
            }
          }
          offset = dataOffset + compressedSize;
        } else {
          offset++;
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
