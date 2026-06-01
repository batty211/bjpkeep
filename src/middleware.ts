import { NextRequest, NextResponse } from "next/server";

export async function middleware(
  req: NextRequest
) {
  const userName = req.cookies.get(
    "bjpkeep-user"
  )?.value;

  const isLoginPage =
    req.nextUrl.pathname === "/login";

  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (!userName && !isLoginPage) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  if (userName && isLoginPage) {
    return NextResponse.redirect(
      new URL("/", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};