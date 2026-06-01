import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const actorName =
    (await cookies()).get(
      "bjpkeep-user"
    )?.value;
  const body = await req.json();

  const item = await prisma.item.findUnique({
    where: {
      id: body.itemId,
    },
    include: {
      cabinet: {
        include: {
          room: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  if (item.cabinetId === body.cabinetId) {
    return NextResponse.json(
      { error: "Item is already in this cabinet" },
      { status: 400 }
    );
  }

  const targetCabinet = await prisma.cabinet.findUnique({
    where: {
      id: body.cabinetId,
    },
    include: {
      room: true,
    },
  });

  if (!targetCabinet) {
    return NextResponse.json(
      { error: "Cabinet not found" },
      { status: 404 }
    );
  }

  await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      cabinetId: body.cabinetId,
    },
  });

await prisma.activityLog.create({
  data: {
    actorName,
    action: "MOVE_ITEM",
    details: `${item.name}: ${item.cabinet.code} -> ${targetCabinet.code}`,
  },
});

  return NextResponse.json({
    success: true,
  });
}