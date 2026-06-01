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