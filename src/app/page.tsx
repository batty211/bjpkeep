import AppLayout from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import ItemSearch from "@/components/search/item-search";
import Link from "next/link";

export default async function Home() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h1 className="text-3xl font-bold">🔍 Find Your Stuff</h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Find where your stuff is stored.
          </p>

          <div className="mt-4 space-y-4">
            <ItemSearch />

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/inventory"
                className="rounded-lg border border-[var(--border-color)] px-4 py-3 text-center font-medium hover:bg-[var(--bg-hover)]"
              >
                ➕ Add Item
              </Link>

              <Link
                href="/locations"
                className="rounded-lg border border-[var(--border-color)] px-4 py-3 text-center font-medium hover:bg-[var(--bg-hover)]"
              >
                📍 Locations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
