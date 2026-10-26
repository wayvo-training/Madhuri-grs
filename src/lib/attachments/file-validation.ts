export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ATTACHMENTS_PER_GRIEVANCE = 5; // Maximum 5 files per grievance

export const DANGEROUS_EXTENSIONS = new Set([
  "html",
  "htm",
  "svg",
  "xhtml",
  "xml",
  "js",
  "mjs",
  "ts",
  "tsx",
  "php",
  "sh",
  "bat",
  "cmd",
  "exe",
  "vbs",
  "ps1",
  "jar",
  "msi",
  "dll",
  "com",
  "scr",
  "pif",
  "application",
  "gadget",
  "attack",
]);

export const DANGEROUS_MIME_TYPES = new Set([
  "text/html",
  "image/svg+xml",
  "application/xhtml+xml",
  "text/xml",
  "application/xml",
  "application/javascript",
  "text/javascript",
  "application/x-msdownload",
  "application/x-sh",
  "application/x-php",
]);

export const ALLOWED_FILE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "rtf",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "mp3",
  "wav",
  "mp4",
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadedFile(
  fileName: string,
  fileType: string,
  fileSize: number,
): FileValidationResult {
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${fileName}" exceeds the 5MB limit (${(fileSize / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const rawMimeType = (fileType || "").toLowerCase().split(";")[0].trim();

  if (
    !ext ||
    DANGEROUS_EXTENSIONS.has(ext) ||
    DANGEROUS_MIME_TYPES.has(rawMimeType)
  ) {
    return {
      valid: false,
      error: `File "${fileName}" is not permitted for security reasons (scripts, executables, HTML, and SVG files are forbidden).`,
    };
  }

  if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File "${fileName}" has an unsupported extension (.${ext}). Allowed formats: PDF, Word, Excel, PowerPoint, Text, CSV, and common images (PNG, JPEG, WebP, GIF).`,
    };
  }

  return { valid: true };
}
