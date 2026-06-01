import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const item = await prisma.item.findUnique({
    where: {
      id: body.itemId,
    },
    include: {
      shelf: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      shelfId: body.shelfId,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "MOVE_ITEM",
      details: `${item.name}: ${item.shelf.code} -> ${body.shelfCode}`,
    },
  });

  return NextResponse.json({
    success: true,
  });
}