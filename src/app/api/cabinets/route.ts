import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const cabinet = await prisma.cabinet.create({
    data: {
      roomId: body.roomId,
      name: body.name,
      code: body.code,
    },
  });

  return NextResponse.json(cabinet);
}