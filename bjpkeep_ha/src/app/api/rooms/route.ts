import { prisma } from "@/lib/prisma";
import { deleteImagesForItems } from "@/lib/item-delete";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function roomCodeConflictResponse() {
  return NextResponse.json(
    { error: "Room code ซ้ำ กรุณาใช้ code อื่น" },
    { status: 409 }
  );
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function GET() {
  const rooms = await prisma.room.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(rooms);
}

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const room = await prisma.room.create({
      data: {
        name: body.name?.trim(),
        code: body.code?.trim(),
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return roomCodeConflictResponse();
    }

    throw error;
  }
}

export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 });
  }

  try {
    const room = await prisma.room.update({
      where: {
        id: body.id,
      },
      data: {
        name: body.name?.trim(),
        code: body.code?.trim(),
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return roomCodeConflictResponse();
    }

    throw error;
  }
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body.id || new URL(req.url).searchParams.get("id");
  const force = Boolean(body.force);
  const user = await getCurrentUser();
  const actorName = user.name;

  if (!id) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({
    where: {
      id,
    },
    include: {
      cabinets: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const cabinetIds = room.cabinets.map((cabinet) => cabinet.id);
  const itemCount = cabinetIds.length
    ? await prisma.item.count({
        where: {
          cabinetId: {
            in: cabinetIds,
          },
        },
      })
    : 0;

  if ((cabinetIds.length > 0 || itemCount > 0) && !force) {
    return NextResponse.json(
      {
        error: `Room นี้มี ${cabinetIds.length} cabinet(s) และ ${itemCount} item(s)`,
        cabinetCount: cabinetIds.length,
        itemCount,
        requiresConfirmation: true,
      },
      { status: 409 }
    );
  }

  const items = await prisma.item.findMany({
    where: {
      cabinetId: {
        in: cabinetIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  await deleteImagesForItems({
    cabinetId: {
      in: cabinetIds,
    },
  });

  await prisma.room.delete({
    where: {
      id,
    },
  });

  if (items.length > 0) {
    await prisma.activityLog.createMany({
      data: items.map((item) => ({
        action: "DELETE_ITEM",
        actorName,
        details: `Deleted item: ${item.name} when deleting room: ${room.name}`,
      })),
    });
  }

  return NextResponse.json({ success: true });
}
