import { toast } from "sonner";

/**
 * Triggers a client-side file download safely in Next.js browser context.
 * Resolves API redirects and fetches files directly as Blob to guarantee
 * downloads across all browsers without cross-origin redirect blocks.
 */
export async function triggerFileDownload(
  url: string,
  filename?: string,
): Promise<void> {
  if (typeof window === "undefined" || !url) return;

  const downloadParamUrl =
    url.startsWith("/api/attachments/") && !url.includes("download=true")
      ? `${url}${url.includes("?") ? "&" : "?"}download=true`
      : url;

  try {
    let directUrl = downloadParamUrl;

    // 1. If it's an internal attachment download API route, fetch the direct signed URL via JSON
    if (downloadParamUrl.startsWith("/api/attachments/")) {
      const jsonEndpoint = `${downloadParamUrl}${downloadParamUrl.includes("?") ? "&" : "?"}format=json`;
      const res = await fetch(jsonEndpoint, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          const errData = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          toast.error("Access Restricted", {
            description:
              errData?.message || "You don't have access to this document.",
          });
          return;
        }
        toast.error("Download Failed", {
          description: "Unable to download this file at this time.",
        });
        return;
      }

      const data = (await res.json()) as {
        downloadUrl?: string;
        fileName?: string;
      };
      if (data.downloadUrl) {
        directUrl = data.downloadUrl;
        if (!filename && data.fileName) {
          filename = data.fileName;
        }
      }
    }

    // 2. Fetch binary stream as Blob for seamless, guaranteed local download
    const fileResponse = await fetch(directUrl);
    if (fileResponse.ok) {
      const blob = await fileResponse.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      if (filename) {
        link.download = filename;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10000);
      return;
    }

    if (fileResponse.status === 403 || fileResponse.status === 401) {
      const errData = (await fileResponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      toast.error("Access Restricted", {
        description:
          errData?.message || "You don't have access to this document.",
      });
      return;
    }
  } catch (err) {
    console.warn(
      "Direct blob download failed, falling back to window navigation",
      err,
    );
  }

  // 3. Fallback: window location navigation (only for non-attachment or unhandled errors)
  if (!downloadParamUrl.startsWith("/api/attachments/")) {
    window.location.assign(downloadParamUrl);
  }
}
