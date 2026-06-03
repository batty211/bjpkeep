import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import Image from "next/image";
import { BaseLink } from "@/lib/ingress-utils";
import { createCanvas, loadImage } from "canvas";
import { createCabinetQrPayload } from "@/lib/cabinet-qr";

export default async function CabinetQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cabinet = await prisma.cabinet.findUnique({
    where: { id },

    include: {
      room: true,

      items: true,
    },
  });

  if (!cabinet) {
    return (
      <AppLayout>
        <div>Cabinet not found</div>
      </AppLayout>
    );
  }

  const qrPayload = createCabinetQrPayload(cabinet.id);

  const qrOnlyDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 2,
    width: 300,
  });

  const qrImage = await loadImage(qrOnlyDataUrl);

  const canvas = createCanvas(340, 380);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 340, 380);

  ctx.drawImage(qrImage, 20, 20, 300, 300);

  ctx.fillStyle = "black";
  ctx.font = "24px 'Noto Sans Thai'";
  ctx.textAlign = "center";
  ctx.fillText(`${cabinet.name} (${cabinet.code})`, 170, 350);

  const qrDataUrl = canvas.toDataURL("image/png");

  return (
    <AppLayout>
      <div className="mx-auto max-w-md space-y-6 text-center">
        <BaseLink href="/locations" className="inline-block text-sm text-blue-600 hover:underline">
          ← Back to Locations
        </BaseLink>
        <h1 className="text-3xl font-bold">🗄️ {cabinet.name}</h1>

        <div className="text-[var(--text-secondary)]">{cabinet.room.name}</div>

        <Image src={qrDataUrl} alt="QR Code" width={300} height={300} className="mx-auto" />
        <div className="font-medium">
          {cabinet.name} ({cabinet.code})
        </div>

        <BaseLink
          href={`/inventory?cabinetId=${cabinet.id}`}
          className="mt-4 inline-block rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)]"
        >
          ➕ Add Item in this Cabinet
        </BaseLink>

        <a
          href={qrDataUrl}
          download={`${cabinet.code}.png`}
          className="inline-block rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)]"
        >
          🖨️ Download QR
        </a>

        <div className="break-all text-sm text-[var(--text-secondary)]">{qrPayload}</div>
      </div>
    </AppLayout>
  );
}
