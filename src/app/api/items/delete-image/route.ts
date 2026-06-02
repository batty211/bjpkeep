import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(req: Request) {
  const { imageId } = await req.json();

  const image = await prisma.itemImage.findUnique({
    where: {
      id: imageId,
    },
  });

  if (!image) {
    return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
  }

  if (image.path?.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", image.path);

    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }
  }

  await prisma.itemImage.delete({
    where: {
      id: imageId,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
