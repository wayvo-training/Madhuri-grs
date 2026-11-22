import { type NextRequest, NextResponse } from "next/server";
import { getClientRequestMeta, logger } from "@/lib/logger";
import { authorizeApi } from "@/lib/permissions";
import { generateReportCsv } from "@/lib/reports/csv-export";
import { generateReportExcel } from "@/lib/reports/excel-export";
import { generateReportPdf } from "@/lib/reports/pdf-export";

export async function GET(request: NextRequest) {
  let requestingUser = null;
  let parsedReportType: "OPERATIONAL" | "RESOLUTION" | "PATTERNS" | null = null;
  let parsedFormat: "CSV" | "EXCEL" | "PDF" = "CSV";
  const rawFilters: Record<string, string | undefined> = {};

  try {
    // 1. Authorize user with VIEW_REPORTS permission and authorized roles
    const auth = await authorizeApi({
      permission: "VIEW_REPORTS",
      role: ["ADMIN", "DEPARTMENT_HEAD"],
    });

    if ("error" in auth) {
      return auth.error;
    }

    const { user } = auth;
    requestingUser = user;

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams;
    const reportTypeParam = (
      searchParams.get("reportType") || ""
    ).toUpperCase();
    const formatParam = (searchParams.get("format") || "CSV").toUpperCase();

    // Map aliases for reportType
    if (reportTypeParam === "OPERATIONAL") {
      parsedReportType = "OPERATIONAL";
    } else if (reportTypeParam === "RESOLUTION" || reportTypeParam === "TAT") {
      parsedReportType = "RESOLUTION";
    } else if (
      reportTypeParam === "PATTERNS" ||
      reportTypeParam === "TREND" ||
      reportTypeParam === "TRENDS"
    ) {
      parsedReportType = "PATTERNS";
    }

    // Validate format per LLD 3.10.6
    if (formatParam === "CSV") {
      parsedFormat = "CSV";
    } else if (formatParam === "EXCEL" || formatParam === "XLSX") {
      parsedFormat = "EXCEL";
    } else if (formatParam === "PDF") {
      parsedFormat = "PDF";
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unsupported export format. Supported formats are CSV, EXCEL (.xlsx), and PDF (.pdf).",
        },
        { status: 400 },
      );
    }

    // Validate reportType
    if (!parsedReportType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or missing reportType. Must be OPERATIONAL, RESOLUTION, or PATTERNS.",
        },
        { status: 400 },
      );
    }

    // Extract filters
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const subcategoryId = searchParams.get("subcategoryId") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const status = searchParams.get("status") || undefined;
    const slaStatus = searchParams.get("slaStatus") || undefined;
    const assignmentStatus = searchParams.get("assignmentStatus") || undefined;
    const calculationMode = searchParams.get("calculationMode") || undefined;

    // Validate date strings if supplied
    if (startDate && Number.isNaN(new Date(startDate).getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid startDate format. Please provide a valid ISO date.",
        },
        { status: 400 },
      );
    }

    if (endDate && Number.isNaN(new Date(endDate).getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid endDate format. Please provide a valid ISO date.",
        },
        { status: 400 },
      );
    }

    rawFilters.startDate = startDate;
    rawFilters.endDate = endDate;
    rawFilters.departmentId = departmentId;
    rawFilters.categoryId = categoryId;
    rawFilters.subcategoryId = subcategoryId;
    rawFilters.priority = priority;
    rawFilters.status = status;
    rawFilters.slaStatus = slaStatus;
    rawFilters.assignmentStatus = assignmentStatus;
    rawFilters.calculationMode = calculationMode;

    const { ip, userAgent } = await getClientRequestMeta();

    // 3. Generate Output Based on Format
    if (parsedFormat === "PDF") {
      const { buffer, fileName, recordCount } = await generateReportPdf(
        parsedReportType,
        rawFilters,
        user,
      );

      // Audit Successful Export Activity (Section 4.7 / 3.10.6)
      await logger.logReportExport({
        reportType: parsedReportType,
        format: "PDF",
        outcome: "SUCCESS",
        user,
        filters: rawFilters,
        fileName,
        recordCount,
        ip,
        userAgent,
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      });
    }

    if (parsedFormat === "EXCEL") {
      const { buffer, fileName, recordCount } = await generateReportExcel(
        parsedReportType,
        rawFilters,
        user,
      );

      // Audit Successful Export Activity (Section 4.7 / 3.10.6)
      await logger.logReportExport({
        reportType: parsedReportType,
        format: "EXCEL",
        outcome: "SUCCESS",
        user,
        filters: rawFilters,
        fileName,
        recordCount,
        ip,
        userAgent,
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      });
    }

    // CSV Generation
    const { csvContent, fileName, recordCount } = await generateReportCsv(
      parsedReportType,
      rawFilters,
      user,
    );

    // Audit Successful Export Activity (Section 4.7 / 3.10.6)
    await logger.logReportExport({
      reportType: parsedReportType,
      format: "CSV",
      outcome: "SUCCESS",
      user,
      filters: rawFilters,
      fileName,
      recordCount,
      ip,
      userAgent,
    });

    return new NextResponse(`\uFEFF${csvContent}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Report export failed";

    const isClientError =
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("not authorized") ||
      errorMessage.includes("no assigned department");

    // Audit Failed Export Activity if user is identified
    if (requestingUser && parsedReportType) {
      try {
        const { ip, userAgent } = await getClientRequestMeta();
        await logger.logReportExport({
          reportType: parsedReportType,
          format: parsedFormat,
          outcome: "FAILED",
          user: requestingUser,
          filters: rawFilters,
          errorMessage,
          ip,
          userAgent,
        });
      } catch (logErr) {
        console.error("Failed to log export failure:", logErr);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: isClientError ? 403 : 500 },
    );
  }
}
