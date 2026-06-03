import AppLayout from "@/components/layout/app-layout";
import QrScanner from "@/components/qr/qr-scanner";
import { BaseLink } from "@/lib/ingress-utils";

export default function ScanPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <BaseLink href="/inventory" className="text-sm text-blue-600 hover:underline">
            ← Back to Inventory
          </BaseLink>
          <h1 className="text-3xl font-bold">Scan Cabinet</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Scan a BJP Keep cabinet QR to view items and add new items to that cabinet.
          </p>
        </div>

        <QrScanner />
      </div>
    </AppLayout>
  );
}
