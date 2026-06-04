import { mkdir, writeFile } from "node:fs/promises";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { v4 as uuid } from "uuid";
import { getThumbnailFilename, getThumbnailPath, UPLOAD_DIR } from "@/lib/item-images";
import { createItemThumbnail } from "@/lib/item-thumbnails";
import {
  getLovelaceActor,
  lovelaceJson,
  lovelaceOptionsResponse,
  requireLovelaceAuth,
} from "@/lib/lovelace-api";

function withLovelaceImagePaths<T extends { images?: { path: string }[] }>(item: T): T {
  return {
    ...item,
    images: item.images?.map((image) => ({
      ...image,
      thumbnailPath: getThumbnailPath(image.path),
    })),
  };
}

function getPositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function getSafeImageExtension(file: File): string {
  const mimeExtension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filenameExtension = path.extname(file.name).replace(".", "").toLowerCase();

  return ["jpg", "jpeg", "png", "webp"].includes(filenameExtension) ? filenameExtension : mimeExtension;
}

async function saveLovelaceImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${uuid()}.${getSafeImageExtension(file)}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  await createItemThumbnail(filename, buffer);

  return `/uploads/items/${filename}`;
}

async function addImagesToItem(itemId: string, files: File[]) {
  const paths = await Promise.all(files.map(saveLovelaceImage));

  if (paths.length === 0) {
    return [];
  }

  await prisma.itemImage.createMany({
    data: paths.map((imagePath) => ({
      itemId,
      path: imagePath,
    })),
  });

  return prisma.itemImage.findMany({
    where: {
      itemId,
      path: {
        in: paths,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

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

async function deleteItemImages(itemId: string) {
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

async function getItemForLovelace(itemId: string) {
  const item = await prisma.item.findUnique({
    where: {
      id: itemId,
    },
    include: {
      cabinet: {
        include: {
          room: true,
        },
      },
      images: true,
    },
  });

  return item ? withLovelaceImagePaths(item) : null;
}

async function handleMultipartPost(req: Request, actorName: string) {
  const formData = await req.formData();
  const action = String(formData.get("action") || "");
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (action === "create_item") {
    const name = String(formData.get("name") || "").trim();
    const cabinetId = String(formData.get("cabinetId") || "");

    if (!name || !cabinetId) {
      return lovelaceJson({ error: "name and cabinetId are required" }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        name,
        cabinetId,
      },
    });

    if (files.length > 0) {
      await addImagesToItem(item.id, files);
    }

    await prisma.activityLog.create({
      data: {
        actorName,
        action: "CREATE_ITEM",
        details: files.length > 0 ? `Created item with ${files.length} image(s): ${item.name}` : `Created item: ${item.name}`,
      },
    });

    return lovelaceJson({ item: await getItemForLovelace(item.id) });
  }

  if (action === "add_images") {
    const itemId = String(formData.get("itemId") || "");

    if (!itemId || files.length === 0) {
      return lovelaceJson({ error: "itemId and files are required" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item) {
      return lovelaceJson({ error: "Item not found" }, { status: 404 });
    }

    await addImagesToItem(item.id, files);
    await prisma.activityLog.create({
      data: {
        actorName,
        action: "UPDATE_ITEM",
        details: `Added ${files.length} image(s) to ${item.name}`,
      },
    });

    return lovelaceJson({ item: await getItemForLovelace(item.id) });
  }

  return lovelaceJson({ error: "Unknown multipart action" }, { status: 400 });
}

export function OPTIONS() {
  return lovelaceOptionsResponse();
}

export async function GET(req: Request) {
  const authResponse = requireLovelaceAuth(req);

  if (authResponse) {
    return authResponse;
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "summary";

  if (resource === "rooms") {
    const rooms = await prisma.room.findMany({
      include: {
        cabinets: {
          include: {
            items: {
              include: {
                images: true,
              },
              orderBy: {
                name: "asc",
              },
            },
          },
          orderBy: {
            code: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return lovelaceJson({
      rooms: rooms.map((room) => ({
        ...room,
        cabinets: room.cabinets.map((cabinet) => ({
          ...cabinet,
          items: cabinet.items.map(withLovelaceImagePaths),
        })),
      })),
    });
  }

  if (resource === "cabinets") {
    const includeItems = searchParams.get("includeItems") !== "0";
    const includeItemCounts = searchParams.get("includeItemCounts") === "1";

    if (!includeItems) {
      if (includeItemCounts) {
        const cabinets = await prisma.cabinet.findMany({
          include: {
            room: true,
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: {
            code: "asc",
          },
        });

        return lovelaceJson({
          cabinets: cabinets.map(({ _count, ...cabinet }) => ({
            ...cabinet,
            itemCount: _count.items,
          })),
        });
      }

      const cabinets = await prisma.cabinet.findMany({
        include: {
          room: true,
        },
        orderBy: {
          code: "asc",
        },
      });

      return lovelaceJson({ cabinets });
    }

    const cabinets = await prisma.cabinet.findMany({
      include: {
        room: true,
        items: {
          include: {
            images: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    return lovelaceJson({
      cabinets: cabinets.map((cabinet) => ({
        ...cabinet,
        items: cabinet.items.map(withLovelaceImagePaths),
      })),
    });
  }

  if (resource === "cabinet") {
    const cabinetId = searchParams.get("id");

    if (!cabinetId) {
      return lovelaceJson({ error: "Cabinet id is required" }, { status: 400 });
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: {
        id: cabinetId,
      },
      include: {
        room: true,
        items: {
          include: {
            images: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!cabinet) {
      return lovelaceJson({ error: "Cabinet not found" }, { status: 404 });
    }

    return lovelaceJson({
      cabinet: {
        ...cabinet,
        items: cabinet.items.map(withLovelaceImagePaths),
      },
    });
  }

  if (resource === "items") {
    const q = searchParams.get("q") || "";
    const cabinetId = searchParams.get("cabinetId") || undefined;
    const page = getPositiveInt(searchParams.get("page"), 1, 100000);
    const pageSize = getPositiveInt(searchParams.get("pageSize"), 10, 50);
    const where = {
      ...(cabinetId ? { cabinetId } : {}),
      ...(q
        ? {
            OR: [
              {
                name: {
                  contains: q,
                },
              },
              {
                cabinet: {
                  code: {
                    contains: q,
                  },
                },
              },
            ],
          }
        : {}),
    };
    const totalItems = await prisma.item.count({ where });
    const items = await prisma.item.findMany({
      where,
      include: {
        cabinet: {
          include: {
            room: true,
          },
        },
        images: true,
      },
      orderBy: {
        name: "asc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return lovelaceJson({
      items: items.map(withLovelaceImagePaths),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    });
  }

  return lovelaceJson({
    ok: true,
    resources: ["rooms", "cabinets", "cabinet", "items"],
  });
}

export async function POST(req: Request) {
  const authResponse = requireLovelaceAuth(req);

  if (authResponse) {
    return authResponse;
  }

  const actorName = getLovelaceActor(req);

  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    try {
      return await handleMultipartPost(req, actorName);
    } catch (error) {
      return lovelaceJson(
        {
          error: error instanceof Error ? error.message : "Failed to upload image",
        },
        {
          status: 400,
        }
      );
    }
  }

  const body = await req.json();
  const action = body.action;
  const requestActorName = body.actorName || actorName;

  if (action === "create_item") {
    const item = await prisma.item.create({
      data: {
        name: body.name,
        cabinetId: body.cabinetId,
      },
      include: {
        images: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: requestActorName,
        action: "CREATE_ITEM",
        details: `Created item: ${item.name}`,
      },
    });

    return lovelaceJson({ item });
  }

  if (action === "update_item") {
    const existingItem = await prisma.item.findUnique({
      where: {
        id: body.id,
      },
    });

    if (!existingItem) {
      return lovelaceJson({ error: "Item not found" }, { status: 404 });
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

    await prisma.activityLog.create({
      data: {
        actorName: requestActorName,
        action: "UPDATE_ITEM",
        details: `${existingItem.name} -> ${item.name}`,
      },
    });

    return lovelaceJson({ item });
  }

  if (action === "delete_item") {
    const item = await prisma.item.findUnique({
      where: {
        id: body.id,
      },
    });

    if (!item) {
      return lovelaceJson({ error: "Item not found" }, { status: 404 });
    }

    await deleteItemImages(item.id);
    await prisma.item.delete({
      where: {
        id: item.id,
      },
    });
    await prisma.activityLog.create({
      data: {
        actorName: requestActorName,
        action: "DELETE_ITEM",
        details: `Deleted item: ${item.name}`,
      },
    });

    return lovelaceJson({ success: true });
  }

  if (action === "delete_image") {
    const image = await prisma.itemImage.findUnique({
      where: {
        id: body.imageId,
      },
      include: {
        item: true,
      },
    });

    if (!image) {
      return lovelaceJson({ error: "Image not found" }, { status: 404 });
    }

    await deleteImageFile(image.path);
    await prisma.itemImage.delete({
      where: {
        id: image.id,
      },
    });
    await prisma.activityLog.create({
      data: {
        actorName: requestActorName,
        action: "UPDATE_ITEM",
        details: `Deleted image from ${image.item.name}`,
      },
    });

    return lovelaceJson({ item: await getItemForLovelace(image.itemId) });
  }

  return lovelaceJson({ error: "Unknown action" }, { status: 400 });
}
