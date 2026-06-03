import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const ingressPath = req.headers.get("x-ingress-path") || "";
  const { pathname } = req.nextUrl;

  // Compute the path without the ingress prefix for internal routing
  let internalPath = pathname;
  if (ingressPath && pathname.startsWith(ingressPath)) {
    internalPath = pathname.replace(ingressPath, "") || "/";
  }

  // Define response - if we are stripping prefix, we MUST rewrite
  let res: NextResponse;
  if (internalPath !== pathname) {
    res = NextResponse.rewrite(new URL(internalPath, req.url));
  } else {
    res = NextResponse.next();
  }

  // Store the ingress path in a cookie so the client can use it for links
  // We do this on every request to ensure it's always available
  if (ingressPath) {
    res.cookies.set("bjpkeep-ingress-path", ingressPath, { path: "/", sameSite: "lax" });
  }

  return res;
}

export const config = {
  // Match ALL paths to ensure we catch static assets and pages
  matcher: ["/:path*"],
};
