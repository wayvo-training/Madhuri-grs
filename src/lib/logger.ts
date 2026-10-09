import type { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type LogCategory =
  | "SESSION"
  | "API_CALL"
  | "NAVIGATION"
  | "ERROR"
  | "CONFIG"
  | "SECURITY";

export interface WhoMetadata {
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  employee_code?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface ApiCallLogOptions {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  user?: {
    user_id: bigint;
    first_name?: string;
    last_name?: string | null;
    email: string;
    employee_code?: string;
    roles?: { role_name: string };
  } | null;
  ip?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
  details?: Record<string, unknown>;
}

export interface SessionLogOptions {
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "SESSION_EXPIRED";
  user?: {
    user_id: bigint;
    first_name?: string;
    last_name?: string | null;
    email: string;
    employee_code?: string;
    roles?: { role_name: string };
  } | null;
  emailAttempted?: string;
  ip?: string | null;
  userAgent?: string | null;
  reason?: string;
}

export interface NavigationLogOptions {
  fromPath?: string | null;
  toPath: string;
  user?: {
    user_id: bigint;
    first_name?: string;
    last_name?: string | null;
    email: string;
    employee_code?: string;
    roles?: { role_name: string };
  } | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Extract Client IP and User-Agent from Next.js Headers safely
 */
export async function getClientRequestMeta(): Promise<{
  ip: string;
  userAgent: string;
}> {
  try {
    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");
    const realIp = h.get("x-real-ip");
    const ip = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || "127.0.0.1";
    const userAgent = h.get("user-agent") || "unknown";
    return { ip, userAgent };
  } catch {
    return { ip: "127.0.0.1", userAgent: "unknown" };
  }
}

/**
 * Enterprise Audit & Observability Logger
 */
class EnterpriseLogger {
  /**
   * Log API requests, responses, status codes and execution times
   */
  async logApiCall(opts: ApiCallLogOptions): Promise<void> {
    const isError = opts.statusCode >= 400;
    const action = isError ? "API_REQUEST_ERROR" : "API_REQUEST_SUCCESS";

    const who: WhoMetadata = {
      user_id: opts.user ? opts.user.user_id.toString() : null,
      name: opts.user
        ? `${opts.user.first_name || ""} ${opts.user.last_name || ""}`.trim()
        : "Anonymous / Guest",
      email: opts.user?.email || null,
      role: opts.user?.roles?.role_name || "UNAUTHENTICATED",
      employee_code: opts.user?.employee_code || null,
      ip_address: opts.ip || "127.0.0.1",
      user_agent: opts.userAgent || "Unknown Agent",
    };

    try {
      await prisma.audit_logs.create({
        data: {
          user_id: opts.user?.user_id || null,
          action,
          entity_type: "API_CALL",
          ip_address: who.ip_address,
          new_value: {
            category: "API_CALL",
            method: opts.method,
            path: opts.path,
            statusCode: opts.statusCode,
            durationMs: opts.durationMs,
            success: !isError,
            errorMessage: opts.errorMessage || null,
            who,
            details: opts.details || null,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      console.error("Failed to write API call log:", err);
    }
  }

  /**
   * Log authentication and session lifecycle events
   */
  async logSession(opts: SessionLogOptions): Promise<void> {
    const who: WhoMetadata = {
      user_id: opts.user ? opts.user.user_id.toString() : null,
      name: opts.user
        ? `${opts.user.first_name || ""} ${opts.user.last_name || ""}`.trim()
        : null,
      email: opts.user?.email || opts.emailAttempted || null,
      role: opts.user?.roles?.role_name || null,
      employee_code: opts.user?.employee_code || null,
      ip_address: opts.ip || "127.0.0.1",
      user_agent: opts.userAgent || "Unknown Agent",
    };

    try {
      await prisma.audit_logs.create({
        data: {
          user_id: opts.user?.user_id || null,
          action: opts.action,
          entity_type: "SESSION",
          ip_address: who.ip_address,
          new_value: {
            category: "SESSION",
            action: opts.action,
            reason: opts.reason || null,
            email: who.email,
            who,
            timestamp: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      console.error("Failed to write session log:", err);
    }
  }

  /**
   * Log user navigation & route traversal events
   */
  async logNavigation(opts: NavigationLogOptions): Promise<void> {
    const who: WhoMetadata = {
      user_id: opts.user ? opts.user.user_id.toString() : null,
      name: opts.user
        ? `${opts.user.first_name || ""} ${opts.user.last_name || ""}`.trim()
        : "Anonymous User",
      email: opts.user?.email || null,
      role: opts.user?.roles?.role_name || "GUEST",
      employee_code: opts.user?.employee_code || null,
      ip_address: opts.ip || "127.0.0.1",
      user_agent: opts.userAgent || "Unknown Agent",
    };

    try {
      await prisma.audit_logs.create({
        data: {
          user_id: opts.user?.user_id || null,
          action: "PAGE_NAVIGATION",
          entity_type: "NAVIGATION",
          ip_address: who.ip_address,
          new_value: {
            category: "NAVIGATION",
            fromPath: opts.fromPath || null,
            toPath: opts.toPath,
            who,
            timestamp: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      console.error("Failed to write navigation log:", err);
    }
  }

  /**
   * Log unexpected runtime or API errors
   */
  async logError(
    actionName: string,
    error: unknown,
    context?: {
      user?: {
        user_id: bigint;
        first_name?: string;
        last_name?: string | null;
        email: string;
        roles?: { role_name: string };
      } | null;
      ip?: string | null;
      details?: Record<string, unknown>;
    },
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;

    const who: WhoMetadata = {
      user_id: context?.user ? context.user.user_id.toString() : null,
      name: context?.user
        ? `${context.user.first_name || ""} ${context.user.last_name || ""}`.trim()
        : "System / Guest",
      email: context?.user?.email || null,
      role: context?.user?.roles?.role_name || null,
      ip_address: context?.ip || "127.0.0.1",
    };

    try {
      await prisma.audit_logs.create({
        data: {
          user_id: context?.user?.user_id || null,
          action: `ERROR_${actionName.toUpperCase()}`,
          entity_type: "ERROR",
          ip_address: who.ip_address,
          new_value: {
            category: "ERROR",
            errorMessage,
            errorStack,
            who,
            details: context?.details || null,
            timestamp: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      console.error("Failed to write error log:", err);
    }
  }
}

export const logger = new EnterpriseLogger();
