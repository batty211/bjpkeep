import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET
);

export async function middleware(
  req: NextRequest
) {
  const token =
    req.cookies.get(
      "bjpkeep-token"
    )?.value;

  const isLoginPage =
    req.nextUrl.pathname === "/login";

  if (!token) {
    if (isLoginPage) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  try {
    await jwtVerify(
      token,
      secret
    );

    if (isLoginPage) {
      return NextResponse.redirect(
        new URL("/", req.url)
      );
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }
}

export const config = {
  matcher: [
    "/",
    "/inventory/:path*",
    "/locations/:path*",
    "/assets/:path*",
    "/activity/:path*",
    "/settings/:path*",
    "/login",
  ],
};