import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.item.findMany({
    include: {
      cabinet: {
        include: {
          room: true,
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
      cabinetId: body.cabinetId,
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

  if (existingItem?.cabinetId !== body.cabinetId) {
    changes.push("Cabinet changed");
  }

  const item = await prisma.item.update({
    where: {
      id: body.id,
    },
    data: {
      name: body.name,
      cabinetId: body.cabinetId,
    },
  });

  if (changes.length > 0) {
    await prisma.activityLog.create({
      data: {
        action: "UPDATE_ITEM",
        details: `Item updated: ${item.name}`,
      },
    });
  }

  return NextResponse.json(item);
}