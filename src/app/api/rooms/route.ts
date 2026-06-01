import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rooms = await prisma.room.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(rooms);
}

export async function POST(req: Request) {
  const body = await req.json();

  const room = await prisma.room.create({
    data: {
      name: body.name,
      code: body.code,
    },
  });

  return NextResponse.json(room);
}