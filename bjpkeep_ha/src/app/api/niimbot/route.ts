import { createQrLabelImage, createSmallLabelImage } from "@/lib/niimbot-labels";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PrintKind = "label" | "qr";

function getDeviceId(kind: PrintKind) {
  return kind === "label" ? process.env.NIIMBOT_LABEL_DEVICE_ID : process.env.NIIMBOT_QR_DEVICE_ID;
}

async function buildLabelPayload(cabinet: { id: string; name: string; code: string; room: { name: string } }) {
  const imageUrl = await createSmallLabelImage(cabinet);

  return {
    width: 240,
    height: 96,
    rotate: 90,
    density: 3,
    payload: [
      {
        type: "dlimg",
        url: imageUrl,
        x: 0,
        y: 0,
        xsize: 240,
        ysize: 96,
        rotate: 0,
      },
    ],
  };
}

async function buildQrPayload(cabinet: { id: string; name: string; code: string; room: { name: string } }) {
  const imageUrl = await createQrLabelImage(cabinet);

  return {
    width: 400,
    height: 400,
    density: 5,
    payload: [
      {
        type: "dlimg",
        url: imageUrl,
        x: 0,
        y: 0,
        xsize: 400,
        ysize: 400,
        rotate: 0,
      },
    ],
  };
}

async function callNiimbotPrint(deviceId: string, data: Record<string, unknown>) {
  const supervisorToken = process.env.SUPERVISOR_TOKEN;

  if (!supervisorToken) {
    return NextResponse.json(
      { error: "SUPERVISOR_TOKEN is not available. Niimbot printing only works inside Home Assistant." },
      { status: 503 }
    );
  }

  const response = await fetch("http://supervisor/core/api/services/niimbot/print", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supervisorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target: {
        device_id: deviceId,
      },
      ...data,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    const error =
      response.status >= 500 && message.includes("Server got itself in trouble")
        ? "Home Assistant เชื่อมต่อเครื่องพิมพ์ไม่ได้ กรุณาปิดแอป NIIMBOT บนมือถือหรืออุปกรณ์อื่นที่กำลังเชื่อมต่อเครื่องพิมพ์อยู่ แล้วตรวจว่าเครื่องเปิดและ Bluetooth proxy มองเห็นเครื่อง"
        : message || `Niimbot print failed with HTTP ${response.status}`;

    return NextResponse.json({ error }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "qr" ? "qr" : "label";
  const cabinetId = String(body.cabinetId || "");
  const deviceId = getDeviceId(kind);

  if (!deviceId) {
    return NextResponse.json(
      {
        error:
          kind === "qr"
            ? "ยังไม่ได้ตั้งค่า niimbot_qr_device_id สำหรับเครื่อง QR"
            : "ยังไม่ได้ตั้งค่า niimbot_label_device_id สำหรับเครื่อง label",
      },
      { status: 400 }
    );
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: {
      id: cabinetId,
    },
    include: {
      room: true,
    },
  });

  if (!cabinet) {
    return NextResponse.json({ error: "Cabinet not found" }, { status: 404 });
  }

  const printPayload = kind === "qr" ? await buildQrPayload(cabinet) : await buildLabelPayload(cabinet);

  return callNiimbotPrint(deviceId, printPayload);
}
