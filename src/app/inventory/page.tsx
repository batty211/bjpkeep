import AppLayout from "@/components/layout/app-layout";
import ItemForm from "@/components/items/item-form";
import MoveItemForm from "@/components/items/move-item-form";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const shelves = await prisma.shelf.findMany({
    orderBy: {
      code: "asc",
    },
  });
    

  const items = await prisma.item.findMany({
    include: {
      shelf: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Inventory
        </h1>

        <ItemForm shelves={shelves} />

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">
            Items
          </h2>

          {items.map((item) => (
            <div
              key={item.id}
              className="mb-2 rounded border p-3"
            >
              <div className="font-medium">
                {item.name}
              </div>

              <div className="text-sm text-gray-500">
                      {item.quantity} {item.unit}
                      <MoveItemForm
  itemId={item.id}
  shelves={shelves}
/>
              </div>

              <div className="text-sm text-gray-500">
                {item.shelf.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}