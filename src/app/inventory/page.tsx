import AppLayout from "@/components/layout/app-layout";
import ItemForm from "@/components/items/item-form";
import MoveItemForm from "@/components/items/move-item-form";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import ItemSearch from "@/components/search/item-search";

export default async function InventoryPage() {
  async function deleteItem(formData: FormData) {
    "use server";

    const itemId = formData.get("itemId") as string;

    await prisma.itemImage.deleteMany({
      where: { itemId },
    });

    await prisma.item.delete({
      where: { id: itemId },
    });

    revalidatePath("/inventory");
  }

  const shelves = await prisma.shelf.findMany({
    orderBy: {
      code: "asc",
    },
  });
    

const items = await prisma.item.findMany({
  include: {
    shelf: {
      include: {
        cabinet: {
          include: {
            room: true,
          },
        },
      },
    },
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
        <ItemSearch />

        <details className="rounded-xl border bg-white p-4">
          <summary className="cursor-pointer font-semibold">
            ➕ Add Item
          </summary>

          <div className="mt-4">
            <ItemForm shelves={shelves} />
          </div>
        </details>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">
            Items
          </h2>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
              >
                <Link
                  href={`/items/${item.id}`}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0].path}
                        alt={item.name}
                        width={120}
                        height={120}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold">
                      {item.name}
                    </div>

                    <div className="mt-1 text-sm font-medium text-blue-600">
                      📍 {item.shelf.cabinet.room.name} &gt; {item.shelf.cabinet.code} &gt; {item.shelf.code}
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      📦 {item.quantity} {item.unit}
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    ›
                  </div>
                </Link>

                <div className="border-t p-4">
                  <details>
                    <summary className="cursor-pointer text-sm text-gray-600">
                      Actions ▾
                    </summary>

                    <div className="mt-3 space-y-3">
                      <MoveItemForm
                        itemId={item.id}
                        shelves={shelves}
                      />

                      <div className="flex gap-2">
                        <Link
                          href={`/items/${item.id}/edit`}
                          className="flex-1 rounded border px-3 py-2 text-center text-sm"
                        >
                          ✏️ Edit
                        </Link>

                        <details className="flex-1">
                          <summary className="cursor-pointer rounded border border-red-300 px-3 py-2 text-center text-sm text-red-600 list-none">
                            🗑️ Delete
                          </summary>

                          <form action={deleteItem} className="mt-2">
                            <input
                              type="hidden"
                              name="itemId"
                              value={item.id}
                            />

                            <button
                              type="submit"
                              className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white"
                            >
                              Confirm Delete
                            </button>
                          </form>
                        </details>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}