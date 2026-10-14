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

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.title = documentTitle;

    // Transfer stylesheets and font links
    document
      .querySelectorAll("link[rel='stylesheet'], style")
      .forEach((node) => {
        frameDoc.head.appendChild(node.cloneNode(true));
      });

    const printStyle = frameDoc.createElement("style");
    printStyle.textContent = `
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
    `;
    frameDoc.head.appendChild(printStyle);

    const printableWrapper = frameDoc.createElement("div");
    printableWrapper.className = "printable-content";

    if (reportHeaderTitle) {
      const headerDiv = frameDoc.createElement("div");
      headerDiv.setAttribute(
        "style",
        "border-bottom: 2px solid #0F766E; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;",
      );
      headerDiv.innerHTML = `
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
      `;
      printableWrapper.appendChild(headerDiv);
    }

    const clone = targetElement.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(
        ".print\\:hidden, button, a[target='_blank'], [data-print-ignore='true']",
      )
      .forEach((el) => {
        el.remove();
      });

    printableWrapper.appendChild(clone);
    frameDoc.body.appendChild(printableWrapper);

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
