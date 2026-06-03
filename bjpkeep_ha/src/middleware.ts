import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const ingressPath = req.headers.get("x-ingress-path") || "";
  const { pathname } = req.nextUrl;

  // Compute the path without the ingress prefix for internal routing
  let internalPath = pathname;
  if (ingressPath && pathname.startsWith(ingressPath)) {
    internalPath = pathname.replace(ingressPath, "") || "/";
  }

  // If we are on an ingress path, rewrite to internal path so Next.js matches the route
  if (internalPath !== pathname) {
    // For assets and APIs, we just rewrite internally
    if (
      internalPath.startsWith("/_next") ||
      internalPath.startsWith("/api") ||
      internalPath.startsWith("/uploads") ||
      internalPath === "/favicon.ico"
    ) {
      return NextResponse.rewrite(new URL(internalPath, req.url));
    }

    // For other routes, rewrite so Next.js can find the page
    return NextResponse.rewrite(new URL(internalPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
