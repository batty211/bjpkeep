import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const cabinets = await prisma.cabinet.findMany({
    include: {
      room: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  return NextResponse.json(cabinets);
}

export async function POST(req: Request) {
  const body = await req.json();

  const room = await prisma.room.findUnique({
    where: { id: body.roomId },
  });

  if (!room) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 }
    );
  }

  const cabinetCount = await prisma.cabinet.count({
    where: {
      roomId: body.roomId,
    },
  });

  const generatedCode = `${room.code}-C${String(cabinetCount + 1).padStart(2, "0")}`;

  const cabinet = await prisma.cabinet.create({
    data: {
      roomId: body.roomId,
      name: body.name,
      code: body.code?.trim() || generatedCode,
    },
  });

  return NextResponse.json(cabinet);
}