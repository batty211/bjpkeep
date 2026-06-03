import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const ingressHeader = req.headers.get("x-ingress-path") || "";
  const { pathname } = req.nextUrl;

  // Log for debugging
  console.log(`Middleware - Path: ${pathname}, IngressHeader: ${ingressHeader}`);

  // If we have an ingress path, ensure assets are correctly rewritten
  // Check both _next and static (for assets)
  if (ingressHeader && (pathname.startsWith("/_next/") || pathname.startsWith("/static/"))) {
    const newUrl = new URL(`${ingressHeader}${pathname}`, req.url);
    console.log(`Middleware - Rewriting to: ${newUrl.toString()}`);
    return NextResponse.rewrite(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
