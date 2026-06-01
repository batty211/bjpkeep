import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.item.findMany({
    include: {
      shelf: {
        include: {
          cabinet: {
            include: {
              room: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();

  const item =
  await prisma.item.create({
    data: {
      name: body.name,
      quantity:
        Number(body.quantity),
      unit: body.unit,
      category:
        body.category,
      shelfId:
        body.shelfId,

      images:
        body.imagePath
          ? {
              create: {
                path: body.imagePath,
              },
            }
          : undefined,
    },
    include: {
      images: true,
    },
  });

  return NextResponse.json(item);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const existingItem = await prisma.item.findUnique({
    where: {
      id: body.id,
    },
  });

  const changes: string[] = [];

  if (existingItem?.name !== body.name) {
    changes.push(
      `Name: ${existingItem?.name ?? "-"} -> ${body.name}`
    );
  }

  if (existingItem?.quantity !== Number(body.quantity)) {
    changes.push(
      `Quantity: ${existingItem?.quantity ?? 0} -> ${body.quantity}`
    );
  }

  if (existingItem?.unit !== body.unit) {
    changes.push(
      `Unit: ${existingItem?.unit ?? "-"} -> ${body.unit}`
    );
  }

  if (existingItem?.category !== body.category) {
    changes.push(
      `Category: ${existingItem?.category ?? "-"} -> ${body.category}`
    );
  }

  if (existingItem?.shelfId !== body.shelfId) {
    changes.push("Shelf changed");
  }

  const item = await prisma.item.update({
    where: {
      id: body.id,
    },
    data: {
      name: body.name,
      quantity: Number(body.quantity),
      unit: body.unit,
      category: body.category,
      shelfId: body.shelfId,
    },
  });

  if (changes.length > 0) {
    await prisma.activityLog.create({
      data: {
        action: "UPDATE_ITEM",
        details: changes.join(" | "),
      },
    });
  }

  return NextResponse.json(item);
}