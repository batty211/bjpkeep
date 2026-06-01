import Image from "next/image";
import Link from "next/link";
import AppLayout from "@/components/layout/app-layout";
import UploadImageForm from "@/components/items/upload-image-form";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ItemDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: {
      id,
    },
    include: {
      images: true,
      shelf: {
        include: {
          cabinet: {
            include: {
              room: true,
            },
          },
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
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  if (!item) {
    return (
      <AppLayout>
        <div className="text-xl font-semibold">
          Item not found
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/inventory"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Inventory
          </Link>

          <Link
            href={`/items/${item.id}/edit`}
            className="text-sm text-green-600 hover:underline"
          >
            ✏️ Edit Item
          </Link>
        </div>
        <h1 className="text-3xl font-bold">
          {item.name}
        </h1>

        <div className="rounded-xl border bg-white p-6">
          {item.images.length > 0 && (
            <>
              <Image
                src={item.images[0].path}
                alt={item.name}
                width={800}
                height={800}
                className="mb-4 max-h-[500px] w-full rounded-lg object-contain"
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
                      className="h-28 w-full rounded border object-cover"
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">
                Name
              </div>
              <div className="font-medium">
                {item.name}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Category
              </div>
              <div className="font-medium">
                {item.category ?? "-"}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Quantity
              </div>
              <div className="font-medium">
                {item.quantity} {item.unit}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Shelf
              </div>
              <div className="font-medium">
                {item.shelf.code}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Cabinet
              </div>
              <div className="font-medium">
                {item.shelf.cabinet.name}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Room
              </div>
              <div className="font-medium">
                {item.shelf.cabinet.room.name}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Created At
              </div>
              <div className="font-medium">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Media
          </h2>

          <div className="mb-4 text-sm text-gray-600">
            Total Images: {item.images.length}
          </div>

          <UploadImageForm itemId={item.id} />
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Recent Activity
          </h2>

          {activityLogs.length === 0 ? (
            <div className="text-gray-500">
              No activity found
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded border p-3"
                >
                  <div className="font-medium">
                    {log.action}
                  </div>

                  <div className="text-xs text-blue-600">
                    By: {log.user?.username ?? log.user?.name ?? "Unknown User"}
                  </div>

                  <div className="text-sm text-gray-600">
                    {log.details}
                  </div>

                  <div className="text-xs text-gray-400">
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