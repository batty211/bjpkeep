import Image from "next/image";
import Link from "next/link";
import AppLayout from "@/components/layout/app-layout";
import UploadImageForm from "@/components/items/upload-image-form";
import MoveItemForm from "@/components/items/move-item-form";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: {
      id,
    },
    include: {
      images: true,
      cabinet: {
        include: {
          room: true,
        },
      },
    },
  });

  const activityLogs = await prisma.activityLog.findMany({
    where: {
      details: {
        contains: item?.name ?? "",
      },
    },

    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const cabinets = await prisma.cabinet.findMany({
    orderBy: {
      name: "asc",
    },
  });

  async function deleteItem() {
    "use server";

    await prisma.itemImage.deleteMany({
      where: {
        itemId: id,
      },
    });

    await prisma.activityLog.deleteMany({
      where: {
        details: {
          contains: item?.name ?? "",
        },
      },
    });

    await prisma.item.delete({
      where: {
        id,
      },
    });
    redirect("/inventory");
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="text-xl font-semibold">Item not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/inventory" className="text-sm text-blue-600 hover:underline">
            ← Back to Inventory
          </Link>

          <Link href={`/items/${item.id}/edit`} className="text-sm text-green-600 hover:underline">
            ✏️ Edit Item
          </Link>

          <form action={deleteItem}>
            <button type="submit" className="text-sm text-red-600 hover:underline">
              🗑️ Delete Item
            </button>
          </form>
        </div>
        <h1 className="text-3xl font-bold">{item.name}</h1>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          {item.images.length > 0 && (
            <>
              <Image
                src={item.images[0].path}
                alt={item.name}
                width={800}
                height={800}
                className="mb-4 max-h-[500px] w-full rounded-lg object-contain"
                unoptimized
              />

              {item.images.length > 1 && (
                <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {item.images.map((image) => (
                    <Image
                      key={image.id}
                      src={image.path}
                      alt={item.name}
                      width={200}
                      height={200}
                      className="h-28 w-full rounded border border-[var(--border-color)] object-cover"
                      unoptimized
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-[var(--text-secondary)]">Name</div>
              <div className="font-medium">{item.name}</div>
            </div>

            <div>
              <div className="text-sm text-[var(--text-secondary)]">Category</div>
            </div>

            <div>
              <div className="text-sm text-[var(--text-secondary)]">Quantity</div>
            </div>

            <div>
              <div className="text-sm text-[var(--text-secondary)]">Cabinet</div>
              <div className="font-medium">{item.cabinet.name}</div>
            </div>

            <div>
              <div className="text-sm text-[var(--text-secondary)]">Room</div>
              <div className="font-medium">{item.cabinet.room.name}</div>
            </div>

            <div>
              <div className="text-sm text-[var(--text-secondary)]">Created At</div>
              <div className="font-medium">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-xl font-semibold">Move Item</h2>

          <MoveItemForm itemId={item.id} cabinets={cabinets} />
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-xl font-semibold">Media</h2>

          <div className="mb-4 text-sm text-[var(--text-secondary)]">
            Total Images: {item.images.length}
          </div>

          <UploadImageForm itemId={item.id} />
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

          {activityLogs.length === 0 ? (
            <div className="text-[var(--text-secondary)]">No activity found</div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="rounded border border-[var(--border-color)] p-3">
                  <div className="font-medium">{log.action}</div>

                  <div className="text-xs text-blue-600">By: {log.actorName ?? "Unknown"}</div>

                  <div className="text-sm text-[var(--text-secondary)]">{log.details}</div>

                  <div className="text-xs text-[var(--text-secondary)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
