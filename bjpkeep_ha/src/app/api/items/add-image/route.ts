

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.itemId || !body.path) {
    return NextResponse.json(
      {
        error: "itemId and path are required",
      },
      {
        status: 400,
      }
    );
  }

  const image = await prisma.itemImage.create({
    data: {
      itemId: body.itemId,
      path: body.path,
    },
  });

  return NextResponse.json(image);
}