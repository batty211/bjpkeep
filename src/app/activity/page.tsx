import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;

  const currentPage = Number(page ?? "1");
  const pageSize = 10;

  const where = q
    ? {
        OR: [
          { action: { contains: q } },
          { details: { contains: q } },
          { actorName: { contains: q } },
        ],
      }
    : {};

  const totalLogs = await prisma.activityLog.count({ where });

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-6">Activity</h1>

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search activity..."
          className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2"
        />
      </form>

      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-3"
          >
            <div className="font-medium">
              {log.actorName ?? "Unknown"} → {log.action}
            </div>

            <div>{log.details}</div>

            <div className="text-sm text-[var(--text-secondary)]">
              {log.createdAt.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-[var(--text-secondary)]">
          Page {currentPage} of {totalPages} ({totalLogs} logs)
        </div>

        <div className="flex gap-2">
          {currentPage > 1 && (
            <a
              href={`/activity?page=${currentPage - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="rounded border border-[var(--border-color)] px-3 py-1"
            >
              ← Prev
            </a>
          )}

          {currentPage < totalPages && (
            <a
              href={`/activity?page=${currentPage + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="rounded border border-[var(--border-color)] px-3 py-1"
            >
              Next →
            </a>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
