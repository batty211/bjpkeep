import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: {
      username: body.username,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(
    body.password,
    user.passwordHash
  );

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "30d",
    }
  );

  const res = NextResponse.json({
    success: true,
  });

  res.cookies.set(
    "bjpkeep-token",
    token,
    {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  );

  return res;
}