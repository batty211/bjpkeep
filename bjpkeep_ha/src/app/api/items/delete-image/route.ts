import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { getThumbnailFilename, UPLOAD_DIR } from "@/lib/item-images";

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
    const filename = path.basename(image.path);
    const filePath = path.join(UPLOAD_DIR, filename);
    const thumbnailPath = path.join(UPLOAD_DIR, "thumbs", getThumbnailFilename(filename));

    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }

    try {
      await fs.unlink(thumbnailPath);
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
