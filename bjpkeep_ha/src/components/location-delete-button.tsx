"use client";

import { useState } from "react";
import { prefixedFetch } from "@/lib/ingress-utils";

type Props = {
  id: string;
  label: string;
  name: string;
  type: "cabinet" | "room";
};

export default function LocationDeleteButton({ id, label, name, type }: Props) {
  const [deleting, setDeleting] = useState(false);
  const endpoint = type === "cabinet" ? "/api/cabinets" : "/api/rooms";

  async function deleteLocation(force = false) {
    setDeleting(true);

    try {
      const response = await prefixedFetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          force,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 409 && result.requiresConfirmation) {
        const message =
          type === "cabinet"
            ? `${result.error}\n\nยืนยันลบ Cabinet "${name}" พร้อมของทั้งหมดหรือไม่?`
            : `${result.error}\n\nยืนยันลบ Room "${name}" พร้อม Cabinets และ Items ทั้งหมดหรือไม่?`;

        if (window.confirm(message)) {
          await deleteLocation(true);
        }
        return;
      }

      if (!response.ok) {
        alert(result.error ?? `Failed to delete ${type}`);
        return;
      }

      location.reload();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={(event) => {
        event.stopPropagation();
        const message =
          type === "cabinet"
            ? `Delete Cabinet "${name}"? ถ้ามีของอยู่ ระบบจะถามยืนยันอีกครั้ง`
            : `Delete Room "${name}"? ถ้ามี Cabinets หรือ Items อยู่ ระบบจะถามยืนยันอีกครั้ง`;

        if (window.confirm(message)) {
          void deleteLocation();
        }
      }}
      className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {deleting ? "Deleting..." : label}
    </button>
  );
}
