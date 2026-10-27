import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

// Singleton connection pool across hot reloads and server route invocations
if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  globalForPrisma.pgPool.on("error", (err) => {
    console.warn("Recoverable pg pool connection event:", err.message);
  });
}

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg(globalForPrisma.pgPool);
  globalForPrisma.prisma = new PrismaClient({
    adapter,
  });
}

export const pool = globalForPrisma.pgPool;
export const prisma = globalForPrisma.prisma;
