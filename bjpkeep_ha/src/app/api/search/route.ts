import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? "";

  const items = await prisma.item.findMany({
    where: {
      OR: [
        {
          name: {
            contains: q,
          },
        },
        {
          
        },
      ],
    },
    include: {
      cabinet: {
        include: {
          room: true,
        },
      },
    },
  });

  return NextResponse.json(items);
}