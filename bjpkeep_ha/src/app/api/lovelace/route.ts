import { prisma } from "@/lib/prisma";
import {
  getLovelaceActor,
  lovelaceJson,
  lovelaceOptionsResponse,
  requireLovelaceAuth,
} from "@/lib/lovelace-api";

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

    return lovelaceJson({ rooms });
  }

  if (resource === "cabinets") {
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

    return lovelaceJson({ cabinets });
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

    return lovelaceJson({ cabinet });
  }

  if (resource === "items") {
    const q = searchParams.get("q") || "";
    const cabinetId = searchParams.get("cabinetId") || undefined;
    const items = await prisma.item.findMany({
      where: {
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
      },
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
    });

    return lovelaceJson({ items });
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

  const body = await req.json();
  const action = body.action;
  const actorName = body.actorName || getLovelaceActor(req);

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
        actorName,
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
        actorName,
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

    await prisma.itemImage.deleteMany({
      where: {
        itemId: item.id,
      },
    });
    await prisma.item.delete({
      where: {
        id: item.id,
      },
    });
    await prisma.activityLog.create({
      data: {
        actorName,
        action: "DELETE_ITEM",
        details: `Deleted item: ${item.name}`,
      },
    });

    return lovelaceJson({ success: true });
  }

  return lovelaceJson({ error: "Unknown action" }, { status: 400 });
}
