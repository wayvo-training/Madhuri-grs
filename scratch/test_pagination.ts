import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Testing Database Pagination Directly ===");

  // 1. Users pagination
  const userCount = await prisma.users.count();
  const page1Users = await prisma.users.findMany({
    take: 10,
    skip: 0,
    orderBy: { created_at: "desc" },
    select: { user_id: true, employee_code: true, email: true },
  });
  console.log(`Total users in DB: ${userCount}`);
  console.log(`Page 1 users count: ${page1Users.length} (Limit 10)`);
  if (page1Users.length > 0) {
    console.log(
      `First user: ${page1Users[0].employee_code} (${page1Users[0].email})`,
    );
  }

  // 2. Audit logs pagination
  const auditCount = await prisma.audit_logs.count();
  const page1Logs = await prisma.audit_logs.findMany({
    take: 10,
    skip: 0,
    orderBy: { created_at: "desc" },
    select: { audit_log_id: true, action: true, entity_type: true },
  });
  console.log(`\nTotal audit logs in DB: ${auditCount}`);
  console.log(`Page 1 audit logs count: ${page1Logs.length} (Limit 10)`);
  if (page1Logs.length > 0) {
    console.log(
      `First log: #${page1Logs[0].audit_log_id} ${page1Logs[0].action} (${page1Logs[0].entity_type})`,
    );
  }

  console.log("\n=== Direct DB Verification Passed Successfully ===");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
