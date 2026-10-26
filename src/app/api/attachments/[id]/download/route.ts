import { type NextRequest, NextResponse } from "next/server";
import {
  checkAttachmentAccess,
  getAttachmentGrantsSafely,
  normalizeStoragePath,
} from "@/lib/attachments/access-control";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAttachmentUrl,
  SUPABASE_BUCKET,
  supabaseAdmin,
} from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attachmentId = BigInt(id);

    const attachment = await prisma.attachments.findUnique({
      where: { attachment_id: attachmentId },
      include: {
        grievances: {
          include: {
            categories: true,
            subcategories: true,
            grievance_departments: {
              include: {
                departments: true,
              },
            },
            assignments: {
              where: {
                assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
              },
            },
          },
        },
      },
    });

    if (!attachment?.grievances) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    const grievance = attachment.grievances;

    // Fetch any explicit department grants (Phase 6B)
    const departmentGrants = await getAttachmentGrantsSafely(attachmentId);

    // Server-side authorization check
    const accessCheck = checkAttachmentAccess({
      user,
      attachment,
      grievance: {
        grievance_id: grievance.grievance_id,
        submitted_by: grievance.submitted_by,
        status: grievance.status,
        title: grievance.title,
        description: grievance.description,
        categoryName: grievance.categories?.category_name,
        subcategoryName: grievance.subcategories?.subcategory_name,
      },
      grievanceDepartments: grievance.grievance_departments.map((gd) => ({
        grievance_department_id: gd.grievance_department_id,
        department_id: gd.department_id,
        department_name: gd.departments?.department_name || "",
        involvement_type: gd.involvement_type,
        status: gd.status,
      })),
      assignments: grievance.assignments.map((a) => ({
        staff_id: a.staff_id,
        grievance_department_id: a.grievance_department_id,
        assignment_status: a.assignment_status,
      })),
      departmentGrants,
    });

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: accessCheck.reason,
        },
        { status: 403 },
      );
    }

    // Normalize and sanitize storage path from file_path
    const normalized = normalizeStoragePath(
      attachment.file_path,
      SUPABASE_BUCKET,
    );
    if (!normalized.valid) {
      return NextResponse.json(
        { error: normalized.error || "Invalid storage path" },
        { status: 400 },
      );
    }

    const isDownload =
      request.nextUrl.searchParams.get("download") === "true" ||
      request.nextUrl.searchParams.has("download");

    // Generate time-limited signed URL (valid for 5 minutes / 300 seconds)
    const signedUrl = await getAttachmentUrl(
      normalized.storagePath,
      300,
      true,
      isDownload ? attachment.file_name : undefined,
    );

    const isJsonRequest =
      request.headers.get("accept")?.includes("application/json") ||
      request.nextUrl.searchParams.get("format") === "json";

    if (isJsonRequest) {
      return NextResponse.json({
        success: true,
        downloadUrl: signedUrl,
        fileName: attachment.file_name,
        expiresInSeconds: 300,
      });
    }

    const ext = attachment.file_name.split(".").pop()?.toLowerCase();
    const isOfficeDoc = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(
      ext || "",
    );

    if (!isDownload && isOfficeDoc) {
      // Browsers lack native rendering support for Microsoft Office files (.docx, .xlsx, etc.).
      // Route through Google Docs Viewer for inline browser preview.
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}`;
      return NextResponse.redirect(viewerUrl);
    }

    // Direct binary stream with 200 OK to guarantee downloads without 307 cross-origin redirect blocks
    try {
      const { data: fileBlob, error: downloadError } =
        await supabaseAdmin.storage
          .from(SUPABASE_BUCKET)
          .download(normalized.storagePath);

      if (!downloadError && fileBlob) {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const contentType =
          attachment.file_type || fileBlob.type || "application/octet-stream";
        const disposition = isDownload ? "attachment" : "inline";

        return new NextResponse(arrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `${disposition}; filename="${encodeURIComponent(attachment.file_name)}"`,
            "Content-Length": String(arrayBuffer.byteLength),
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        });
      }
    } catch (streamErr) {
      console.warn(
        "Direct binary streaming fallback to signedUrl redirect:",
        streamErr,
      );
    }

    // Direct signed URL redirect fallback
    return NextResponse.redirect(signedUrl);
  } catch (error: unknown) {
    console.error("Error in GET /api/attachments/[id]/download:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate download URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
