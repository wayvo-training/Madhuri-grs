import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Proxy for early routing boundary enforcement (Next.js 16 convention).
 * Checks for session token cookie before allowing access to protected dashboard routes.
 */
export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const userRole = request.cookies.get("user_role")?.value?.toUpperCase();
  const pathname = request.nextUrl.pathname;

  // 1. If user is already authenticated and visits /login, redirect to their role dashboard
  if (pathname === "/login") {
    if (sessionToken) {
      const destination =
        userRole === "ADMIN"
          ? "/admin/dashboard"
          : userRole === "DEPARTMENT_HEAD"
            ? "/department-head/dashboard"
            : userRole === "STAFF"
              ? "/staff/dashboard"
              : userRole === "END_USER"
                ? "/end-user/dashboard"
                : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  // 2. If user tries to access protected routes without a session cookie, bounce to /login
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Early Edge boundary check: prevent cross-role dashboard access
  if (userRole) {
    if (userRole === "ADMIN") {
      if (
        pathname.startsWith("/department-head") ||
        pathname.startsWith("/staff") ||
        pathname.startsWith("/end-user")
      ) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    } else if (userRole === "DEPARTMENT_HEAD") {
      if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/staff") ||
        pathname.startsWith("/end-user")
      ) {
        return NextResponse.redirect(
          new URL("/department-head/dashboard", request.url),
        );
      }
    } else if (userRole === "STAFF") {
      if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/department-head") ||
        pathname.startsWith("/end-user")
      ) {
        return NextResponse.redirect(new URL("/staff/dashboard", request.url));
      }
    } else if (userRole === "END_USER") {
      if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/department-head") ||
        pathname.startsWith("/staff")
      ) {
        return NextResponse.redirect(
          new URL("/end-user/dashboard", request.url),
        );
      }
    }
  }

  return NextResponse.next();
}

/**
 * Configure paths intercepted by the proxy.
 */
export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/department-head/:path*",
    "/staff/:path*",
    "/end-user/:path*",
  ],
};
