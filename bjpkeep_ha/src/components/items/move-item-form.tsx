"use client";

import { useState } from "react";
import { prefixedFetch } from "@/lib/ingress-utils";

type CabinetOption = {
  id: string;
  name?: string;
  code?: string;
  room?: {
    name?: string;
  } | null;
};

type Props = {
  itemId: string;
  cabinets?: CabinetOption[];
};

export default function MoveItemForm({ itemId, cabinets }: Props) {
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
    <div className="mt-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row">
      <select
        value={cabinetId}
        onChange={(e) => setCabinetId(e.target.value)}
        className="min-w-0 flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
      >
        <option value="">Move To Cabinet</option>
        {cabinets?.map((c) => (
          <option key={c.id} value={c.id}>
            {[c.room?.name, c.code, c.name].filter(Boolean).join(" > ")}
          </option>
        ))}
      </select>

      <button
        onClick={move}
        disabled={!cabinetId}
        className="shrink-0 rounded bg-blue-500 px-3 py-2 text-white disabled:opacity-50"
      >
        Move
      </button>
    </div>
  );
}
