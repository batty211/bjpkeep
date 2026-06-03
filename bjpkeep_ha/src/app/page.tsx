import AppLayout from "@/components/layout/app-layout";
import ItemSearch from "@/components/search/item-search";
import { BaseLink } from "@/lib/ingress-utils";
import QrScanner from "@/components/qr/qr-scanner";

export default async function Home() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <h1 className="text-3xl font-bold">🔍 Find Your Stuff</h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Search by typing or scan a cabinet QR code.
          </p>

          <div className="mt-4 space-y-4">
            <ItemSearch />

            <div className="rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <h2 className="mb-4 font-semibold">Scan Cabinet QR</h2>
              <QrScanner />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <BaseLink
                href="/inventory"
                className="rounded-lg border border-[var(--border-color)] px-4 py-3 text-center font-medium hover:bg-[var(--bg-hover)]"
              >
                ➕ Add Item
              </BaseLink>

              <BaseLink
                href="/locations"
                className="rounded-lg border border-[var(--border-color)] px-4 py-3 text-center font-medium hover:bg-[var(--bg-hover)]"
              >
                📍 Locations
              </BaseLink>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
