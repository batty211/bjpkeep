import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [
    itemCount,
    roomCount,
    cabinetCount,
    shelfCount,
    recentLogs,
  ] = await Promise.all([
    prisma.item.count(),
    prisma.room.count(),
    prisma.cabinet.count(),
    prisma.shelf.count(),
    prisma.activityLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          BJP Keep Dashboard
        </h1>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-gray-500">
              Items
            </div>

            <div className="text-3xl font-bold">
              {itemCount}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-gray-500">
              Rooms
            </div>

            <div className="text-3xl font-bold">
              {roomCount}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-gray-500">
              Cabinets
            </div>

            <div className="text-3xl font-bold">
              {cabinetCount}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-gray-500">
              Shelves
            </div>

            <div className="text-3xl font-bold">
              {shelfCount}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 text-xl font-semibold">
            Recent Activity
          </h2>

          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="rounded border p-3"
              >
                <div className="font-medium">
                  {log.action}
                </div>

                <div className="text-sm text-blue-600">
                  {log.user?.username ??
                    "Unknown"}
                </div>

                <div className="text-sm">
                  {log.details}
                </div>

                <div className="text-xs text-gray-500">
                  {new Date(
                    log.createdAt
                  ).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}