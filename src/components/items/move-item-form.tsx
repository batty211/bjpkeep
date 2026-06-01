"use client";

import { useState } from "react";

export default function MoveItemForm({
  itemId,
  cabinets,
}: any) {
  const [cabinetId, setCabinetId] = useState("");

  async function move() {
    if (!cabinetId) {
      return;
    }

    await fetch("/api/items/move", {
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
    <div className="flex gap-2 mt-2">
      <select
        value={cabinetId}
        onChange={(e) => setCabinetId(e.target.value)}
        className="border rounded p-2"
      >
        <option value="">Move To Cabinet</option>
        {cabinets?.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.code ?? c.name}
          </option>
        ))}
      </select>

      <button
        onClick={move}
        disabled={!cabinetId}
        className="bg-blue-500 text-white px-3 py-2 rounded disabled:opacity-50"
      >
        Move
      </button>
    </div>
  );
}