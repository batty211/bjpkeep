import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";

export default async function Page() {
const logs =
  await prisma.activityLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-6">
        Activity
      </h1>

      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="border rounded p-3 bg-white"
          >
            <div className="font-medium">
              {log.actorName ?? "Unknown"} → {log.action}
            </div>

            <div>
              {log.details}
            </div>

            <div className="text-sm text-gray-500">
              {log.createdAt.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}