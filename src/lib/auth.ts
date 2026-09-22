import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

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

  if (!session) {
    return null;
  }

  // Extract active permission codes
  const permissions: string[] =
    session.users.roles?.role_permissions
      ?.filter((rp) => rp.permissions?.status === "ACTIVE")
      ?.map((rp) => rp.permissions.permission_code) || [];

  // Session expired
  if (session.expires_at < new Date()) {
    await prisma.sessions.delete({
      where: {
        session_id: session.session_id,
      },
    });

    return null;
  }

  // Throttle updating last_accessed_at (only update if last accessed > 5 minutes ago)
  // Non-blocking so authentication and page loads return immediately without awaiting an extra DB write
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (!session.last_accessed_at || session.last_accessed_at < fiveMinutesAgo) {
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

  return {
    ...session.users,
    permissions,
  };
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
