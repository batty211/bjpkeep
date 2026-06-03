import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const ingressPath = req.headers.get("x-ingress-path") || "";
  const { pathname } = req.nextUrl;

  // Compute the path without the ingress prefix for internal routing
  let internalPath = pathname;
  if (ingressPath && pathname.startsWith(ingressPath)) {
    internalPath = pathname.replace(ingressPath, "") || "/";
  }

  // Always rewrite assets/internal calls so they work even if requested with the prefix
  if (
    internalPath.startsWith("/_next") ||
    internalPath.startsWith("/api") ||
    internalPath.startsWith("/uploads") ||
    internalPath === "/favicon.ico"
  ) {
    if (internalPath !== pathname) {
      return NextResponse.rewrite(new URL(internalPath, req.url));
    }
    return NextResponse.next();
  }

  // For other routes, rewrite to internal path so Next.js matches the route
  if (internalPath !== pathname) {
    return NextResponse.rewrite(new URL(internalPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match ALL paths to ensure we catch static assets
  matcher: ["/:path*"],
};
