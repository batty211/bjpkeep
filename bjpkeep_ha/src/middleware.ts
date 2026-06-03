import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const ingressHeader = req.headers.get("x-ingress-path") || "";
  const { pathname } = req.nextUrl;

  // 1. Static Assets & Uploads: Rewrite to include ingress path if missing
  const isAssetOrUpload = 
    pathname.startsWith("/_next/") || 
    pathname.startsWith("/uploads/");

  if (ingressHeader && isAssetOrUpload && !pathname.startsWith(ingressHeader)) {
    return NextResponse.rewrite(new URL(`${ingressHeader}${pathname}`, req.url));
  }

  // 2. Internal routing: Rewrite prefix-prefixed paths to internal paths
  let internalPath = pathname;
  if (ingressHeader && pathname.startsWith(ingressHeader)) {
    internalPath = pathname.replace(ingressHeader, "") || "/";
    return NextResponse.rewrite(new URL(internalPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
