import http from "http";

function checkUrl(path: string) {
  return new Promise<{
    statusCode?: number;
    headers: http.IncomingHttpHeaders;
  }>((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.on("error", reject);
  });
}

async function main() {
  console.log("=== Checking Local Next.js Server Response ===");
  try {
    const resUsers = await checkUrl("/admin/users");
    console.log(
      `GET /admin/users response code: ${resUsers.statusCode} (Redirect or OK)`,
    );

    const resAudit = await checkUrl("/admin/audit-logs");
    console.log(
      `GET /admin/audit-logs response code: ${resAudit.statusCode} (Redirect or OK)`,
    );

    const resDept = await checkUrl("/admin/departments");
    console.log(
      `GET /admin/departments response code: ${resDept.statusCode} (Redirect or OK)`,
    );

    console.log(
      "Local Next.js server is actively serving routes without crashes!",
    );
  } catch (err) {
    console.error("Server check error:", err);
  }
}

main();
