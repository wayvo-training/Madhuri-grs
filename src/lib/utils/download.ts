/**
 * Triggers a client-side file download safely in Next.js browser context.
 */
export function triggerFileDownload(url: string, filename?: string): void {
  if (typeof window === "undefined" || !url) return;

  const link = document.createElement("a");
  link.href = url;
  if (filename) {
    link.download = filename;
  }
  link.rel = "noopener noreferrer";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
