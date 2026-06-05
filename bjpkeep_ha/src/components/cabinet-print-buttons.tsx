"use client";

import { useState } from "react";
import { prefixedFetch } from "@/lib/ingress-utils";

type PrintKind = "label" | "qr";

type Props = {
  cabinetId: string;
};

export default function CabinetPrintButtons({ cabinetId }: Props) {
  const [printing, setPrinting] = useState<PrintKind | null>(null);

  async function print(kind: PrintKind) {
    setPrinting(kind);

    try {
      const response = await prefixedFetch("/api/niimbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cabinetId,
          kind,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(result.error ?? "Print failed");
        return;
      }

      alert(kind === "qr" ? "QR label sent to printer." : "Label sent to printer.");
    } finally {
      setPrinting(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
      <button
        type="button"
        disabled={printing !== null}
        onClick={() => void print("label")}
        className="rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)] disabled:opacity-50"
      >
        {printing === "label" ? "Printing..." : "🖨️ Print 40x12 Label"}
      </button>

      <button
        type="button"
        disabled={printing !== null}
        onClick={() => void print("qr")}
        className="rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)] disabled:opacity-50"
      >
        {printing === "qr" ? "Printing..." : "▣ Print 50x50 QR"}
      </button>
    </div>
  );
}
