import AppLayout from "@/components/layout/app-layout";
import ItemForm from "@/components/items/item-form";
import MoveItemForm from "@/components/items/move-item-form";
import Image from "next/image";
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
    images: true,
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
  className="mb-4 rounded border p-4"
>
  <div className="font-medium text-lg">
    {item.name}
  </div>

  {item.images?.[0] && (
    <Image
      src={item.images[0].path}
      alt={item.name}
      width={150}
      height={150}
      className="my-3 rounded-lg border"
    />
  )}

  <div className="text-sm text-gray-500">
    จำนวน: {item.quantity} {item.unit}
  </div>

  <div className="text-sm text-gray-500">
    Location: {item.shelf.code}
  </div>

  <MoveItemForm
    itemId={item.id}
    shelves={shelves}
  />
</div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}