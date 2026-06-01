import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CabinetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cabinet = await prisma.cabinet.findUnique({
    where: { id },
    include: {
      room: true,
      shelves: {
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
  });

  if (!cabinet) {
    return (
      <AppLayout>
        <div>Cabinet not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            🗄️ {cabinet.name}
          </h1>

          <div className="text-gray-500">
            📍 {cabinet.room.name}
          </div>
        </div>

        {cabinet.shelves.map((shelf) => (
          <div
            key={shelf.id}
            className="rounded-xl border bg-white p-4"
          >
            <h2 className="font-semibold">
              📦 {shelf.code}
            </h2>

            <div className="mt-3 space-y-2">
              {shelf.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="block rounded border p-3 hover:bg-gray-50"
                >
                  {item.name}
                </Link>
              ))}

              {shelf.items.length === 0 && (
                <div className="text-sm text-gray-400">
                  No items
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}