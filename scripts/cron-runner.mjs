#!/usr/bin/env node

/**
 * GRS Background Scheduler Cron Runner
 * Executes /api/sla/evaluate every 5 minutes in Render production environment.
 * Authenticates using x-cron-secret header without leaking credentials.
 */

async function runScheduler() {
  const rawBaseUrl =
    process.env.APP_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (!rawBaseUrl) {
    console.error(
      "[CRON ERROR] Missing required environment variable: APP_BASE_URL (or RENDER_EXTERNAL_URL).",
    );
    console.error(
      "[CRON ERROR] Please configure APP_BASE_URL in the Render dashboard or render.yaml.",
    );
    process.exit(1);
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[CRON ERROR] Missing required environment variable: CRON_SECRET.",
    );
    console.error(
      "[CRON ERROR] Please configure CRON_SECRET in the Render dashboard or render.yaml.",
    );
    process.exit(1);
  }

  // Ensure base URL has protocol
  const normalizedBase =
    rawBaseUrl.startsWith("http://") || rawBaseUrl.startsWith("https://")
      ? rawBaseUrl
      : `https://${rawBaseUrl}`;

  // Clean trailing slashes
  const baseUrl = normalizedBase.replace(/\/+$/, "");
  const targetUrl = `${baseUrl}/api/sla/evaluate`;

  const timeoutMs = 30000; // 30-second timeout
  const startTime = Date.now();

  console.log(`[CRON START] Triggering GRS SLA background scheduler sweep...`);
  console.log(`[CRON INFO] Target: ${targetUrl}`);
  console.log(`[CRON INFO] Timestamp: ${new Date().toISOString()}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
        "User-Agent": "GRS-Render-Cron/1.0",
      },
      body: JSON.stringify({ source: "render-cron" }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startTime;

    if (!response.ok) {
      let errorBody = "";
      let json = null;
      try {
        json = await response.json();
        errorBody = json.message || JSON.stringify(json);
      } catch {
        errorBody = await response.text().catch(() => "");
      }

      // Safe skip on HTTP 409 Conflict (overlapping sweep prevented by advisory lock)
      if (response.status === 409) {
        console.log(
          `[CRON INFO] Another SLA evaluation or background sweep is currently in progress (${elapsedMs}ms). Safe skip; overlapping execution prevented.`,
        );
        if (errorBody) {
          console.log(`[CRON INFO] Details: ${errorBody}`);
        }
        process.exit(0);
      }

      console.error(
        `[CRON ERROR] Scheduler sweep failed with HTTP status ${response.status} (${response.statusText}) in ${elapsedMs}ms.`,
      );
      if (errorBody) {
        console.error(`[CRON ERROR] Response: ${errorBody}`);
      }

      process.exit(1);
    }

    let result = {};
    try {
      result = await response.json();
    } catch {
      // Non-JSON ok response
    }

    console.log(
      `[CRON SUCCESS] Scheduler sweep executed successfully in ${elapsedMs}ms (HTTP ${response.status}).`,
    );

    if (result && typeof result === "object") {
      const remindersSent = result.reminders?.totalRemindersSent ?? 0;
      const autoClosed = result.autoClosures?.totalProcessed ?? 0;
      const evaluated = result.totalEvaluated ?? 0;
      console.log(
        `[CRON METRICS] Summary: ${evaluated} SLA cycles evaluated, ${remindersSent} pre-expiry reminders dispatched, ${autoClosed} auto-closures processed.`,
      );
    }

    process.exit(0);
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    if (error && error.name === "AbortError") {
      console.error(
        `[CRON TIMEOUT] Request to ${targetUrl} timed out after ${timeoutMs}ms.`,
      );
    } else {
      console.error(
        `[CRON ERROR] Request failed after ${elapsedMs}ms: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    process.exit(1);
  }
}

runScheduler();
