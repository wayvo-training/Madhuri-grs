import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Proxy for early routing boundary enforcement.
 * Checks for session token cookie before allowing access to protected dashboard routes.
 */
export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const pathname = request.nextUrl.pathname;

  // If user tries to access any dashboard without a session cookie, bounce to /login
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Configure paths intercepted by the proxy.
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/department-head/:path*",
    "/staff/:path*",
    "/dashboard/:path*",
  ],
};
