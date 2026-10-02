import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ ERROR: DATABASE_URL is not defined in your .env file.");
  process.exit(1);
}

async function runSeed() {
  const isForce = process.argv.includes("--force");
  console.log("🌱 GRS Database Seeder Initialized");
  console.log("📡 Connecting to PostgreSQL database...");

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL successfully.");

    // Check if data already exists
    const checkUsers = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';",
    );

    if (parseInt(checkUsers.rows[0].count, 10) > 0) {
      const existingUsersRes = await client.query(
        "SELECT COUNT(*) FROM users;",
      );
      const existingCount = parseInt(existingUsersRes.rows[0].count, 10);

      if (existingCount > 0 && !isForce) {
        console.log(
          `\nℹ️  Database is ALREADY populated with ${existingCount} users.`,
        );
        console.log(
          "⚡ Skipping re-seeding to prevent primary key collisions.",
        );
        console.log(
          "👉 To completely wipe and re-seed, run: pnpm run db:seed --force\n",
        );

        // Sync sequences just in case
        await syncSequences(client);
        await displaySummary(client);
        return;
      }

      if (isForce) {
        console.log(
          "⚠️  '--force' flag detected: Truncating existing tables...",
        );
        await client.query(`
          TRUNCATE TABLE 
            audit_logs,
            notifications,
            attachments,
            resolution_reviews,
            knowledge_articles,
            resolutions,
            assignments,
            grievance_departments,
            sla_tracking,
            escalations,
            grievances,
            sla_policies,
            routing_rules,
            priority_rules,
            reopen_policies,
            user_skills,
            skills,
            subcategories,
            categories,
            password_reset_tokens,
            sessions,
            role_permissions,
            users,
            departments,
            permissions,
            roles
          CASCADE;
        `);
        console.log("✅ All tables truncated cleanly.");
      }
    }

    // Resolve seed.sql path
    const seedPath = path.resolve(process.cwd(), "database", "seed.sql");

    if (!fs.existsSync(seedPath)) {
      throw new Error(`seed.sql not found at path: ${seedPath}`);
    }

    console.log(`📖 Reading SQL seed script from ${seedPath}...`);
    const sqlContent = fs.readFileSync(seedPath, "utf-8");

    console.log("⚡ Executing seed.sql statements...");
    const startTime = Date.now();
    await client.query(sqlContent);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ seed.sql executed successfully in ${duration}s!`);

    await syncSequences(client);
    await displaySummary(client);
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function syncSequences(client: Client) {
  console.log("🔄 Synchronizing table primary key sequences...");
  const tablesToSync: [string, string][] = [
    ["roles", "role_id"],
    ["permissions", "permission_id"],
    ["departments", "department_id"],
    ["users", "user_id"],
    ["categories", "category_id"],
    ["subcategories", "subcategory_id"],
    ["priority_rules", "priority_rule_id"],
    ["routing_rules", "routing_rule_id"],
    ["sla_policies", "sla_policy_id"],
    ["reopen_policies", "reopen_policy_id"],
    ["skills", "skill_id"],
    ["user_skills", "user_skill_id"],
    ["grievances", "grievance_id"],
    ["grievance_departments", "grievance_department_id"],
    ["assignments", "assignment_id"],
    ["audit_logs", "audit_log_id"],
  ];

  for (const [table, col] of tablesToSync) {
    try {
      await client.query(`
        SELECT setval(
          pg_get_serial_sequence('${table}', '${col}'),
          COALESCE((SELECT MAX(${col}) FROM ${table}), 1),
          true
        );
      `);
    } catch {
      // Ignored if table or sequence not present
    }
  }
  console.log("✅ Sequences synchronized.");
}

async function displaySummary(client: Client) {
  const [roles, perms, users, depts, grievances] = await Promise.all([
    client.query("SELECT COUNT(*) FROM roles"),
    client.query("SELECT COUNT(*) FROM permissions"),
    client.query("SELECT COUNT(*) FROM users"),
    client.query("SELECT COUNT(*) FROM departments"),
    client.query("SELECT COUNT(*) FROM grievances"),
  ]);

  console.log("\n📊 Database Status Summary:");
  console.log(`   - Roles:        ${roles.rows[0].count}`);
  console.log(`   - Permissions:  ${perms.rows[0].count}`);
  console.log(`   - Users:        ${users.rows[0].count}`);
  console.log(`   - Departments:  ${depts.rows[0].count}`);
  console.log(`   - Grievances:   ${grievances.rows[0].count}`);
  console.log("🎉 Ready for application runtime!\n");
}

runSeed();
