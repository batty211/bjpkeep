import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function POST(req: Request) {
  const token =
  (await cookies()).get(
    "bjpkeep-token"
  )?.value;

let userId: string | undefined;

if (token) {
  const secret =
    new TextEncoder().encode(
      process.env.JWT_SECRET
    );

  const { payload } =
    await jwtVerify(
      token,
      secret
    );

  userId =
    payload.userId as string;
}
  const body = await req.json();

  const item = await prisma.item.findUnique({
    where: {
      id: body.itemId,
    },
    include: {
      cabinet: {
        include: {
          room: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      cabinetId: body.cabinetId,
    },
  });

await prisma.activityLog.create({
  data: {
    userId,
    action: "MOVE_ITEM",
    details: `${item.name}: moved cabinet`,
  },
});

  return NextResponse.json({
    success: true,
  });
}