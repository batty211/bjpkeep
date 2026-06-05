import { prisma } from "@/lib/prisma";
import { deleteImagesForItems } from "@/lib/item-delete";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function cabinetCodeConflictResponse() {
  return NextResponse.json(
    { error: "Code ซ้ำในห้องนี้ กรุณาใช้ code อื่น" },
    { status: 409 }
  );
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function GET() {
  const cabinets = await prisma.cabinet.findMany({
    include: {
      room: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  return NextResponse.json(cabinets);
}

export async function POST(req: Request) {
  const body = await req.json();

  const room = await prisma.room.findUnique({
    where: { id: body.roomId },
  });

  if (!room) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 }
    );
  }

  const cabinetCount = await prisma.cabinet.count({
    where: {
      roomId: body.roomId,
    },
  });

  const generatedCode = `${room.code}-C${String(cabinetCount + 1).padStart(2, "0")}`;

  try {
    const cabinet = await prisma.cabinet.create({
      data: {
        roomId: body.roomId,
        name: body.name?.trim(),
        code: body.code?.trim() || generatedCode,
      },
    });

    return NextResponse.json(cabinet);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return cabinetCodeConflictResponse();
    }

    throw error;
  }
}

export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Cabinet id is required" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({
    where: { id: body.roomId },
  });

  if (!room) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 }
    );
  }

  try {
    const cabinet = await prisma.cabinet.update({
      where: {
        id: body.id,
      },
      data: {
        roomId: body.roomId,
        name: body.name?.trim(),
        code: body.code?.trim(),
      },
    });

    return NextResponse.json(cabinet);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return cabinetCodeConflictResponse();
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
    return NextResponse.json({ error: "Cabinet id is required" }, { status: 400 });
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  if (!cabinet) {
    return NextResponse.json({ error: "Cabinet not found" }, { status: 404 });
  }

  if (cabinet._count.items > 0 && !force) {
    return NextResponse.json(
      {
        error: `Cabinet นี้มีของอยู่ ${cabinet._count.items} รายการ`,
        itemCount: cabinet._count.items,
        requiresConfirmation: true,
      },
      { status: 409 }
    );
  }

  const items = await prisma.item.findMany({
    where: {
      cabinetId: id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  await deleteImagesForItems({
    cabinetId: id,
  });

  await prisma.cabinet.delete({
    where: {
      id,
    },
  });

  if (items.length > 0) {
    await prisma.activityLog.createMany({
      data: items.map((item) => ({
        action: "DELETE_ITEM",
        actorName,
        details: `Deleted item: ${item.name} when deleting cabinet: ${cabinet.name}`,
      })),
    });
  }

  return NextResponse.json({ success: true });
}
