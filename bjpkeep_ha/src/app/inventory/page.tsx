import AppLayout from "@/components/layout/app-layout";
import ItemForm from "@/components/items/item-form";
import MoveItemForm from "@/components/items/move-item-form";
import Image from "next/image";
import { BaseLink } from "@/lib/ingress-utils";
import { getServerPrefixedPath } from "@/lib/ingress-utils-server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import InventoryFilter from "@/components/inventory/inventory-filter";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ cabinetId?: string; page?: string; q?: string }>;
}) {
  const { cabinetId, page, q } = await searchParams;

  const currentPage = Number(page ?? "1");
  const pageSize = 10;

  async function deleteItem(formData: FormData) {
    "use server";

    const itemId = formData.get("itemId") as string;
    const user = await getCurrentUser();
    const actorName = user.name;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    await prisma.itemImage.deleteMany({
      where: { itemId },
    });

    await prisma.activityLog.create({
      data: {
        action: "DELETE_ITEM",
        actorName,
        details: `Deleted item: ${item?.name ?? itemId}`,
      },
    });

    await prisma.item.delete({
      where: { id: itemId },
    });

    revalidatePath("/inventory");
  }

  const where = q
    ? {
        OR: [
          {
            name: {
              contains: q,
            },
          },
          {
            cabinet: {
              code: {
                contains: q,
              },
            },
          },
        ],
      }
    : {};

  const totalItems = await prisma.item.count({ where });

  const items = await prisma.item.findMany({
    where,
    include: {
      cabinet: {
        include: {
          room: true,
        },
      },
      images: true,
    },
    orderBy: {
      name: "asc",
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const queryString = q ? `&q=${encodeURIComponent(q)}` : "";
  const cabinets = await prisma.cabinet.findMany({
    include: {
      room: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Pre-calculate image paths with prefix
  const itemsWithPrefixedImages = await Promise.all(items.map(async (item) => ({
    ...item,
    images: await Promise.all(item.images.map(async (img) => ({
      ...img,
      path: await getServerPrefixedPath(img.path)
    })))
  })));

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <details className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <summary className="cursor-pointer font-semibold">
            {cabinetId ? "➕ Add Item to Selected Cabinet" : "➕ Add Item"}
          </summary>

          <div className="mt-4">
            <ItemForm cabinets={cabinets} cabinetId={cabinetId} />
          </div>
        </details>

        <InventoryFilter initialValue={q ?? ""} />

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h2 className="mb-4 font-semibold">Items</h2>

          <div className="space-y-3">
            {itemsWithPrefixedImages.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm transition hover:shadow-md"
              >
                <BaseLink href={`/items/${item.id}`} className="flex items-center gap-4 p-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0].path}
                        alt={item.name}
                        width={120}
                        height={120}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-gray-400">
                        <div className="text-2xl">📦</div>
                        <div className="text-xs">No Image</div>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold">{item.name}</div>

                    <div className="mt-1 text-sm font-medium text-blue-600">
                      📍 {item.cabinet.room.name} &gt; {item.cabinet.code}
                    </div>

                    <div className="mt-1 text-sm text-[var(--foreground)]">📦 Item</div>
                  </div>

                  <div className="text-sm text-[var(--text-secondary)]">›</div>
                </BaseLink>

                <div className="border-t p-4">
                  <details>
                    <summary className="cursor-pointer text-sm text-[var(--text-secondary)]">
                      Actions ▾
                    </summary>

                    <div className="mt-3 space-y-3">
                      <details>
                        <summary className="cursor-pointer rounded border px-3 py-2 text-center text-sm list-none">
                          📦 Move Item
                        </summary>

                        <div className="mt-3">
                          <MoveItemForm itemId={item.id} cabinets={cabinets} />
                        </div>
                      </details>

                      <div className="flex gap-2">
                        <BaseLink
                          href={`/items/${item.id}/edit`}
                          className="flex-1 rounded border px-3 py-2 text-center text-sm"
                        >
                          ✏️ Edit
                        </BaseLink>

                        <details className="flex-1">
                          <summary className="cursor-pointer rounded border border-red-300 px-3 py-2 text-center text-sm text-red-600 list-none">
                            🗑️ Delete
                          </summary>

                          <form action={deleteItem} className="mt-2">
                            <input type="hidden" name="itemId" value={item.id} />

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
          <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
            <div>
              Page {currentPage} of {totalPages} ({totalItems} items)
            </div>

            <div className="flex gap-2">
              {currentPage > 1 && (
                <BaseLink
                  href={`/inventory?page=${currentPage - 1}${queryString}`}
                  className="rounded border px-3 py-1"
                  prefetch={false}
                >
                  ← Prev
                </BaseLink>
              )}

              {currentPage < totalPages && (
                <BaseLink
                  href={`/inventory?page=${currentPage + 1}${queryString}`}
                  className="rounded border px-3 py-1"
                  prefetch={false}
                >
                  Next →
                </BaseLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
