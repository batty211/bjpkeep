import { createCabinetQrPayload } from "@/lib/cabinet-qr";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PrintKind = "label" | "qr";

function getDeviceId(kind: PrintKind) {
  return kind === "label" ? process.env.NIIMBOT_LABEL_DEVICE_ID : process.env.NIIMBOT_QR_DEVICE_ID;
}

function buildLabelPayload(cabinet: { name: string; code: string; room: { name: string } }) {
  return {
    width: 240,
    height: 96,
    rotate: 90,
    density: 3,
    payload: [
      {
        type: "text",
        x: 8,
        y: 6,
        width: 224,
        height: 42,
        value: cabinet.code,
        font: "ppb.ttf",
        size: 34,
        fit: true,
        align: "center",
      },
      {
        type: "text",
        x: 8,
        y: 52,
        width: 224,
        height: 34,
        value: `${cabinet.room.name} / ${cabinet.name}`,
        font: "ppb.ttf",
        size: 22,
        fit: true,
        align: "center",
      },
    ],
  };
}

function buildQrPayload(cabinet: { id: string; name: string; code: string; room: { name: string } }) {
  return {
    width: 400,
    height: 400,
    density: 5,
    payload: [
      {
        type: "qrcode",
        x: 64,
        y: 18,
        data: createCabinetQrPayload(cabinet.id),
        boxsize: 8,
        border: 2,
        eclevel: "H",
      },
      {
        type: "text",
        x: 24,
        y: 300,
        width: 352,
        height: 44,
        value: cabinet.code,
        font: "ppb.ttf",
        size: 38,
        fit: true,
        align: "center",
      },
      {
        type: "text",
        x: 24,
        y: 344,
        width: 352,
        height: 34,
        value: `${cabinet.room.name} / ${cabinet.name}`,
        font: "ppb.ttf",
        size: 24,
        fit: true,
        align: "center",
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

    return NextResponse.json(
      { error: message || `Niimbot print failed with HTTP ${response.status}` },
      { status: 502 }
    );
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

  return callNiimbotPrint(deviceId, kind === "qr" ? buildQrPayload(cabinet) : buildLabelPayload(cabinet));
}
