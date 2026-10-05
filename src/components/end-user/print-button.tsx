"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintSectionButtonProps {
  targetId: string;
  documentTitle: string;
  reportHeaderTitle?: string;
  label?: string;
  variant?: "outline" | "default";
  className?: string;
}

export function PrintSectionButton({
  targetId,
  documentTitle,
  reportHeaderTitle,
  label = "Download PDF",
  variant = "outline",
  className = "",
}: PrintSectionButtonProps) {
  const handlePrint = () => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      window.print();
      return;
    }

    // Create an invisible iframe for isolated section printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect parent stylesheets (Tailwind + Next fonts)
    const headStyles = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style"),
    )
      .map((el) => el.outerHTML)
      .join("\n");

    // Deep clone the targeted element
    const clone = targetElement.cloneNode(true) as HTMLElement;

    // Remove buttons, links, and interactive elements marked print:hidden
    clone
      .querySelectorAll(
        ".print\\:hidden, button, a[target='_blank'], [data-print-ignore='true']",
      )
      .forEach((el) => {
        el.remove();
      });

    const headerHtml = reportHeaderTitle
      ? `
        <div style="border-bottom: 2px solid #0F766E; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 10px; font-weight: 700; color: #0F766E; letter-spacing: 0.08em; text-transform: uppercase;">
              Government Grievance Redressal System
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">
              ${reportHeaderTitle}
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Official Record &bull; Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      `
      : "";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${headStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 12mm;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .printable-content {
              width: 100% !important;
              max-width: 100% !important;
              background: #ffffff !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-shadow: none !important;
            }
          </style>
        </head>
        <body>
          <div class="printable-content">
            ${headerHtml}
            ${clone.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Give iframe sufficient time to process styles and images
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Section print failed:", err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 450);
  };

  return (
    <Button
      variant={variant}
      onClick={handlePrint}
      className={`flex items-center gap-2 rounded-xl text-sm font-medium print:hidden cursor-pointer ${className}`}
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}

// Backwards compatibility alias
export function PrintButton() {
  return (
    <PrintSectionButton
      targetId="grievance-details-card"
      documentTitle="Grievance Details"
      label="Download PDF"
    />
  );
}
