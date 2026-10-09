import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  "";

export const SUPABASE_BUCKET =
  process.env.SUPABASE_BUCKET || "grievance-attachments";

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface UploadResult {
  path: string;
  publicUrl: string;
  fullPath: string;
}

/**
 * Uploads a file (Buffer, ArrayBuffer, or Blob) to Supabase Storage.
 *
 * @param path Relative path/key in the bucket (e.g. "grievances/GRS-2026-001/doc.pdf")
 * @param fileData File buffer or byte data
 * @param contentType MIME type of the file
 */
export async function uploadToSupabase(
  path: string,
  fileData: Buffer | ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<UploadResult> {
  const { data, error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(path, fileData, {
      contentType: contentType || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    fullPath: data.fullPath,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Generates a public URL or a temporary signed URL for viewing/downloading an attachment.
 *
 * @param path Storage file path
 * @param expiresInSeconds Duration for signed URL validity (default: 3600s / 1hr)
 * @param isPrivate If true, generates a signed URL. If false, returns the public URL.
 */
export async function getAttachmentUrl(
  path: string,
  expiresInSeconds = 3600,
  isPrivate = false,
): Promise<string> {
  if (isPrivate) {
    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  const { data } = supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Deletes a file from Supabase Storage.
 *
 * @param path Storage file path
 */
export async function deleteFromSupabase(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }
}
