import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const POOL_VERSION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
  poolVersion?: number;
};

// Singleton connection pool across hot reloads and server route invocations
if (!globalForPrisma.pgPool || globalForPrisma.poolVersion !== POOL_VERSION) {
  if (globalForPrisma.pgPool) {
    try {
      globalForPrisma.pgPool.end();
    } catch {
      // ignore
    }
  }

  const newPool = new Pool({
    connectionString,
    max: 25,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  newPool.on("error", (err) => {
    console.error("Unexpected error on pg client pool:", err);
  });

  globalForPrisma.pgPool = newPool;
  globalForPrisma.poolVersion = POOL_VERSION;

  const adapter = new PrismaPg(newPool);
  globalForPrisma.prisma = new PrismaClient({
    adapter,
  });
}

export const pool = globalForPrisma.pgPool as Pool;
export const prisma = globalForPrisma.prisma as PrismaClient;
