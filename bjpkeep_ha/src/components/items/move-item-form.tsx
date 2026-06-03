"use client";

import { useState } from "react";
import { prefixedFetch } from "@/lib/ingress-utils";

export default function MoveItemForm({ itemId, cabinets }: any) {
  const [cabinetId, setCabinetId] = useState("");

  async function move() {
    if (!cabinetId) {
      return;
    }

    await prefixedFetch("/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId,
        cabinetId,
      }),
    });

    location.reload();
  }

  return (
    <div className="mt-2 flex gap-2">
      <select
        value={cabinetId}
        onChange={(e) => setCabinetId(e.target.value)}
        className="rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
      >
        <option value="">Move To Cabinet</option>
        {cabinets?.map((c: any) => (
          <option key={c.id} value={c.id}>
            {[c.room?.name, c.code, c.name].filter(Boolean).join(" > ")}
          </option>
        ))}
      </select>

      <button
        onClick={move}
        disabled={!cabinetId}
        className="rounded bg-blue-500 px-3 py-2 text-white disabled:opacity-50"
      >
        Move
      </button>
    </div>
  );
}
