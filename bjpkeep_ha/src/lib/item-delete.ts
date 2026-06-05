import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { getThumbnailFilename, UPLOAD_DIR } from "@/lib/item-images";
import { prisma } from "@/lib/prisma";

async function deleteImageFile(imagePath: string | null | undefined) {
  if (!imagePath?.startsWith("/uploads/")) {
    return;
  }

  const filename = path.basename(imagePath);

  await Promise.all([
    fs.unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined),
    fs.unlink(path.join(UPLOAD_DIR, "thumbs", getThumbnailFilename(filename))).catch(() => undefined),
  ]);
}

export async function deleteItemImages(itemId: string) {
  const images = await prisma.itemImage.findMany({
    where: {
      itemId,
    },
  });

  await Promise.all(images.map((image) => deleteImageFile(image.path)));
  await prisma.itemImage.deleteMany({
    where: {
      itemId,
    },
  });
}

export async function deleteImagesForItems(where: Prisma.ItemWhereInput) {
  const items = await prisma.item.findMany({
    where,
    select: {
      id: true,
      images: {
        select: {
          path: true,
        },
      },
    },
  });

  const itemIds = items.map((item) => item.id);

  if (itemIds.length === 0) {
    return;
  }

  await Promise.all(items.flatMap((item) => item.images.map((image) => deleteImageFile(image.path))));
  await prisma.itemImage.deleteMany({
    where: {
      itemId: {
        in: itemIds,
      },
    },
  });
}
