import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import Image from "next/image";

export default async function CabinetQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cabinet = await prisma.cabinet.findUnique({
    where: {
      id,
    },
    include: {
      room: true,
    },
  });

  if (!cabinet) {
    return (
      <AppLayout>
        <div>Cabinet not found</div>
      </AppLayout>
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const url = `${baseUrl}/cabinets/${cabinet.id}`;

  const qrDataUrl = await QRCode.toDataURL(url);

  return (
    <AppLayout>
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">
          🗄️ {cabinet.name}
        </h1>

        <div className="text-gray-500">
          {cabinet.room.name}
        </div>

        <Image
          src={qrDataUrl}
          alt="QR Code"
          width={300}
          height={300}
          className="mx-auto"
        />

        <a
          href={qrDataUrl}
          download={`${cabinet.code}.png`}
          className="inline-block rounded border px-4 py-2"
        >
          🖨️ Download QR
        </a>

        <div className="break-all text-sm text-gray-500">
          {url}
        </div>
      </div>
    </AppLayout>
  );
}