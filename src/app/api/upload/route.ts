import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadToSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "general";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No valid file provided" },
        { status: 400 },
      );
    }

    // Generate safe unique filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${sanitizedName}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToSupabase(storagePath, buffer, file.type);

    return NextResponse.json({
      success: true,
      filePath: result.path,
      fileUrl: result.publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
