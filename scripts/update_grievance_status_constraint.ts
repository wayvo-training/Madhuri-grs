import { prisma } from "../src/lib/prisma";

async function main() {
  console.log(
    "Updating grievances_status_check constraint to include WAITING_ON_USER...",
  );

  await prisma.$executeRawUnsafe(`
    ALTER TABLE grievances 
    DROP CONSTRAINT IF EXISTS grievances_status_check;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE grievances 
    ADD CONSTRAINT grievances_status_check 
    CHECK (status IN (
      'SUBMITTED', 
      'ROUTED', 
      'ASSIGNED', 
      'IN_PROGRESS', 
      'WAITING_ON_USER', 
      'UNDER_REVIEW', 
      'REOPENED', 
      'REOPEN_REVIEW', 
      'CLOSED', 
      'ESCALATED'
    ));
  `);

  console.log("Constraint updated successfully in PostgreSQL!");
}

main()
  .catch((err) => {
    console.error("Error updating constraint:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
