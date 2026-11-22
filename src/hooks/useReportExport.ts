"use client";

import { useCallback, useState } from "react";

export interface UseReportExportReturn {
  isExporting: boolean;
  exportSuccessMessage: string | null;
  exportErrorMessage: string | null;
  handleExport: <T extends object>(
    filters?: T,
    format?: "CSV" | "EXCEL" | "PDF",
  ) => Promise<void>;
  clearExportMessages: () => void;
}

export function useReportExport(
  reportType: "OPERATIONAL" | "RESOLUTION" | "PATTERNS",
): UseReportExportReturn {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<
    string | null
  >(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(
    null,
  );

  const clearExportMessages = useCallback(() => {
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
  }, []);

  const handleExport = useCallback(
    async <T extends object>(
      filters?: T,
      format: "CSV" | "EXCEL" | "PDF" = "CSV",
    ) => {
      // Prevent repeated submissions while an export is already processing
      if (isExporting) return;

      setIsExporting(true);
      setExportErrorMessage(null);
      setExportSuccessMessage(null);

      try {
        const params = new URLSearchParams();
        params.set("reportType", reportType);
        params.set("format", format);

        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== "") {
              params.set(key, String(value));
            }
          }
        }

        const res = await fetch(`/api/reports/export?${params.toString()}`);

        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}));
          throw new Error(
            errorJson.message ||
              `Export generation failed (HTTP ${res.status})`,
          );
        }

        // Extract filename from Content-Disposition header
        const disposition = res.headers.get("Content-Disposition");
        const ext =
          format === "EXCEL" ? "xlsx" : format === "PDF" ? "pdf" : "csv";
        let filename = `GRS_${reportType}_Report.${ext}`;
        if (disposition?.includes("filename=")) {
          const match = disposition.match(/filename="?([^"]+)"?/);
          if (match?.[1]) {
            filename = match[1];
          }
        }

        // Trigger browser download via object URL
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        const formatLabel =
          format === "EXCEL"
            ? "Excel (.xlsx)"
            : format === "PDF"
              ? "PDF (.pdf)"
              : "CSV";
        setExportSuccessMessage(
          `Report successfully exported as ${formatLabel} (${filename})`,
        );

        // Auto-dismiss success message after 6 seconds
        setTimeout(() => {
          setExportSuccessMessage((prev) =>
            prev?.includes(filename) ? null : prev,
          );
        }, 6000);
      } catch (err: unknown) {
        setExportErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to generate export file. Please retry.",
        );
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, reportType],
  );

  return {
    isExporting,
    exportSuccessMessage,
    exportErrorMessage,
    handleExport,
    clearExportMessages,
  };
}
