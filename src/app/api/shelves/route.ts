import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const shelf = await prisma.shelf.create({
    data: {
      cabinetId: body.cabinetId,
      code: body.code,
    },
  });

  return NextResponse.json(shelf);
}