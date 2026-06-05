import AppLayout from "@/components/layout/app-layout";
import UploadImageForm from "@/components/items/upload-image-form";
import MoveItemForm from "@/components/items/move-item-form";
import ImageGallery from "@/components/items/image-gallery";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BaseLink } from "@/lib/ingress-utils";
import { getServerPrefixedPath } from "@/lib/ingress-utils-server";
import { deleteItemImages } from "@/lib/item-delete";
import { getCurrentUser } from "@/lib/auth";
import ConfirmSubmitButton from "@/components/confirm-submit-button";

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
    include: {
      room: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  async function deleteItem() {
    "use server";

    const user = await getCurrentUser();
    const actorName = user.name;
    const itemToDelete = await prisma.item.findUnique({
      where: {
        id,
      },
    });

    await deleteItemImages(id);

    await prisma.item.delete({
      where: {
        id,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "DELETE_ITEM",
        actorName,
        details: `Deleted item: ${itemToDelete?.name ?? id}`,
      },
    });
    
    const target = await getServerPrefixedPath("/inventory");
    redirect(target);
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="text-xl font-semibold">Item not found</div>
      </AppLayout>
    );
  }

  const prefixedImages = await Promise.all(item.images.map(async (image) => ({
    id: image.id,
    path: await getServerPrefixedPath(image.path),
  })));

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 overflow-hidden px-1">
        <div className="flex flex-wrap items-center gap-3">
          <BaseLink href="/inventory" className="text-sm text-blue-600 hover:underline">
            ← Back to Inventory
          </BaseLink>

          <BaseLink href={`/items/${item.id}/edit`} className="text-sm text-green-600 hover:underline">
            ✏️ Edit Item
          </BaseLink>

          <form action={deleteItem}>
            <ConfirmSubmitButton
              message={`Delete "${item.name}"? This cannot be undone.`}
              className="text-sm text-red-600 hover:underline"
            >
              🗑️ Delete Item
            </ConfirmSubmitButton>
          </form>
        </div>
        <h1 className="break-words text-3xl font-bold">{item.name}</h1>

        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-6">
          {item.images.length > 0 && (
            <ImageGallery
              itemName={item.name}
              images={prefixedImages}
            />
          )}

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <div className="text-sm text-[var(--text-secondary)]">Name</div>
              <div className="break-words font-medium">{item.name}</div>
            </div>

            <div className="min-w-0">
              <div className="text-sm text-[var(--text-secondary)]">Cabinet</div>
              <div className="break-words font-medium">{item.cabinet.name}</div>
            </div>

            <div className="min-w-0">
              <div className="text-sm text-[var(--text-secondary)]">Room</div>
              <div className="break-words font-medium">{item.cabinet.room.name}</div>
            </div>

            <div>
              <div className="text-sm text-[var(--text-secondary)]">Created At</div>
              <div className="font-medium">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">Move Item</h2>

          <MoveItemForm itemId={item.id} cabinets={cabinets} />
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">Media</h2>

          <div className="mb-4 text-sm text-[var(--text-secondary)]">
            Total Images: {item.images.length}
          </div>

          <UploadImageForm itemId={item.id} />
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

          {activityLogs.length === 0 ? (
            <div className="text-[var(--text-secondary)]">No activity found</div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="rounded border border-[var(--border-color)] p-3">
                  <div className="break-words font-medium">{log.action}</div>

                  <div className="text-xs text-blue-600">By: {log.actorName ?? "Unknown"}</div>

                  <div className="break-words text-sm text-[var(--text-secondary)]">{log.details}</div>

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
