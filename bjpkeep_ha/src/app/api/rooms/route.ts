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

export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 });
  }

  const room = await prisma.room.update({
    where: {
      id: body.id,
    },
    data: {
      name: body.name,
      code: body.code,
    },
  });

  return NextResponse.json(room);
}
