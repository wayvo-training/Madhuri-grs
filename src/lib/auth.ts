import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

type UserWithRelations = Prisma.usersGetPayload<{
  include: {
    departments: true;
    roles: {
      include: {
        role_permissions: {
          include: {
            permissions: true;
          };
        };
      };
    };
  };
}>;

export type AuthUser = UserWithRelations & {
  permissions: string[];
};

interface CachedSessionUser {
  user: AuthUser;
  expiresAt: number;
}

const userSessionCache = new Map<string, CachedSessionUser>();
const SESSION_CACHE_TTL_MS = 20 * 1000; // 20 seconds TTL

// Clean up expired cache items periodically
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [token, item] of userSessionCache.entries()) {
      if (item.expiresAt < now) {
        userSessionCache.delete(token);
      }
    }
  }, 60 * 1000);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

export function invalidateUserSessionCache(
  sessionTokenOrUserId?: string | bigint | number,
) {
  if (!sessionTokenOrUserId) {
    userSessionCache.clear();
    return;
  }
  if (
    typeof sessionTokenOrUserId === "bigint" ||
    typeof sessionTokenOrUserId === "number" ||
    /^\d+$/.test(sessionTokenOrUserId)
  ) {
    const targetUserId = BigInt(sessionTokenOrUserId);
    for (const [token, item] of userSessionCache.entries()) {
      if (BigInt(item.user.user_id) === targetUserId) {
        userSessionCache.delete(token);
      }
    }
    return;
  }
  userSessionCache.delete(sessionTokenOrUserId);
}

export const getCurrentUser = cache(
  async function getCurrentUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();

    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return null;
    }

    // Check in-memory cache to prevent multiple concurrent requests from hitting DB
    const now = Date.now();
    const cached = userSessionCache.get(sessionToken);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    try {
      const session = await prisma.sessions.findUnique({
        where: {
          session_token: sessionToken,
        },
        include: {
          users: {
            include: {
              departments: true,
              roles: {
                include: {
                  role_permissions: {
                    include: {
                      permissions: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (session?.users?.status !== "ACTIVE") {
        userSessionCache.delete(sessionToken);
        return null;
      }

      // Extract active permission codes
      const permissions: string[] =
        session.users.roles?.role_permissions
          ?.filter((rp) => rp.permissions?.status === "ACTIVE")
          ?.map((rp) => rp.permissions.permission_code) || [];

      // Session expired
      if (session.expires_at < new Date()) {
        userSessionCache.delete(sessionToken);
        await prisma.sessions
          .delete({
            where: {
              session_id: session.session_id,
            },
          })
          .catch(() => {});

        return null;
      }

      // Throttle updating last_accessed_at (only update if last accessed > 5 minutes ago)
      // Non-blocking so authentication and page loads return immediately without awaiting an extra DB write
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (
        !session.last_accessed_at ||
        session.last_accessed_at < fiveMinutesAgo
      ) {
        prisma.sessions
          .update({
            where: {
              session_id: session.session_id,
            },
            data: {
              last_accessed_at: new Date(),
            },
          })
          .catch((err) => {
            console.error("Failed to update session access time:", err);
          });
      }

      const authUser = {
        ...session.users,
        permissions,
      };

      userSessionCache.set(sessionToken, {
        user: authUser,
        expiresAt: now + SESSION_CACHE_TTL_MS,
      });

      return authUser;
    } catch (error) {
      console.error(
        "Database error retrieving session in getCurrentUser:",
        error,
      );
      return null;
    }
  },
);
