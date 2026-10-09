export interface ClientUploadResult {
  filePath: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Uploads a file via /api/upload to Supabase Storage.
 *
 * @param file The File object from an <input type="file">
 * @param folder Optional subfolder in the bucket (e.g. "resolutions", "grievances", "messages")
 */
export async function uploadFileToSupabase(
  file: File,
  folder = "general",
): Promise<ClientUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error || `Failed to upload file (${res.statusText})`,
    );
  }

  const data = await res.json();
  return {
    filePath: data.filePath,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize,
  };
}
