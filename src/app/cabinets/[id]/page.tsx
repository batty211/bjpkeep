import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CabinetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cabinet = await prisma.cabinet.findUnique({
    where: { id },
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
          <h1 className="text-3xl font-bold">🗄️ {cabinet.name}</h1>

          <div className="text-[var(--text-secondary)]">📍 {cabinet.room.name}</div>
        </div>

        <div className="space-y-3">
          {cabinet.items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="block rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 hover:bg-[var(--bg-hover)]"
            >
              {item.name}
            </Link>
          ))}

          {cabinet.items.length === 0 && (
            <div className="text-sm text-[var(--text-secondary)]">No items</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
