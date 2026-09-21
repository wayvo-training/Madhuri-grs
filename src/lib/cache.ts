/**
 * Enterprise In-Memory Cache with TTL and Tag-based Invalidation
 * Provides microsecond in-memory caching for frequently read reference data
 * (departments, roles, rules, SLA policies) while keeping invalidation simple.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Get a cached item or fetch and store it.
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    tags: string[],
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const existing = this.store.get(key) as CacheEntry<T> | undefined;

    if (existing && existing.expiresAt > now) {
      this.stats.hits++;
      return existing.data;
    }

    this.stats.misses++;
    const freshData = await fetcher();

    this.store.set(key, {
      data: freshData,
      expiresAt: now + ttlSeconds * 1000,
      tags,
    });

    return freshData;
  }

  /**
   * Directly get a key if present and not expired.
   */
  get<T>(key: string): T | null {
    const now = Date.now();
    const existing = this.store.get(key) as CacheEntry<T> | undefined;
    if (existing && existing.expiresAt > now) {
      this.stats.hits++;
      return existing.data;
    }
    return null;
  }

  /**
   * Set a key directly.
   */
  set<T>(key: string, data: T, ttlSeconds: number, tags: string[] = []): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  /**
   * Invalidate all keys matching any of the provided tags.
   */
  invalidateTags(tags: string[]): number {
    const tagSet = new Set(tags);
    let invalidatedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.some((t) => tagSet.has(t))) {
        this.store.delete(key);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  /**
   * Invalidate a single key.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all cached keys.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cache telemetry and metrics.
   */
  getMetrics() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate =
      total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : "0.0";
    return {
      size: this.store.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
    };
  }
}

// Global singleton instance for server runtime
export const serverCache = new InMemoryCache();

// Cache Tags
export const CACHE_TAGS = {
  ROLES: "roles",
  PERMISSIONS: "permissions",
  DEPARTMENTS: "departments",
  USERS: "users",
  RULES_PRIORITY: "rules_priority",
  RULES_ROUTING: "rules_routing",
  RULES_SLA: "rules_sla",
  RULES_REOPEN: "rules_reopen",
} as const;

/**
 * Cached fetcher for active departments (10 min TTL)
 */
export async function getCachedDepartments() {
  const { prisma } = await import("@/lib/prisma");
  return serverCache.getOrSet(
    "all_active_departments",
    600,
    [CACHE_TAGS.DEPARTMENTS],
    async () => {
      return prisma.departments.findMany({
        where: { status: "ACTIVE" },
        orderBy: { department_name: "asc" },
      });
    },
  );
}

/**
 * Cached fetcher for roles and permissions matrix (10 min TTL)
 */
export async function getCachedRoles() {
  const { prisma } = await import("@/lib/prisma");
  return serverCache.getOrSet(
    "all_roles_matrix",
    600,
    [CACHE_TAGS.ROLES, CACHE_TAGS.PERMISSIONS],
    async () => {
      return prisma.roles.findMany({
        orderBy: { role_id: "asc" },
        include: {
          _count: { select: { users: true } },
          role_permissions: {
            include: { permissions: true },
          },
        },
      });
    },
  );
}
