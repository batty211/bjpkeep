import AppLayout from "@/components/layout/app-layout";
import ItemForm from "@/components/items/item-form";
import { prisma } from "@/lib/prisma";
import { BaseLink } from "@/lib/ingress-utils";

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

  const selectedCabinet = {
    id: cabinet.id,
    name: cabinet.name,
    code: cabinet.code,
    room: {
      name: cabinet.room.name,
    },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🗄️ {cabinet.name}</h1>

          <div className="text-[var(--text-secondary)]">📍 {cabinet.room.name}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <BaseLink
            href={`/cabinets/${cabinet.id}/qr`}
            className="rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)]"
          >
            🖨️ Cabinet QR
          </BaseLink>
        </div>

        <details className="rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <summary className="cursor-pointer list-none font-semibold">
            ➕ Add Item in this Cabinet
          </summary>

          <div className="mt-4">
            <ItemForm
              cabinetId={cabinet.id}
              cabinets={[selectedCabinet]}
              stayOnCreate
            />
          </div>
        </details>

        <div className="space-y-3">
          {cabinet.items.map((item) => (
            <BaseLink
              key={item.id}
              href={`/items/${item.id}`}
              className="block rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 hover:bg-[var(--bg-hover)]"
            >
              {item.name}
            </BaseLink>
          ))}

          {cabinet.items.length === 0 && (
            <div className="text-sm text-[var(--text-secondary)]">No items</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
