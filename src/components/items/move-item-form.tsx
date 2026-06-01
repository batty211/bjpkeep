"use client";

import { useState } from "react";

export default function MoveItemForm({
  itemId,
  shelves,
}: any) {
  const [shelfId, setShelfId] = useState("");

  async function move() {
    const shelf = shelves.find(
      (s: any) => s.id === shelfId
    );

    await fetch("/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId,
        shelfId,
        shelfCode: shelf.code,
      }),
    });

    location.reload();
  }

  return (
    <div className="flex gap-2 mt-2">
      <select
        value={shelfId}
        onChange={(e) =>
          setShelfId(e.target.value)
        }
        className="border rounded p-2"
      >
        <option value="">
          Move To
        </option>

        {shelves.map((s: any) => (
          <option
            key={s.id}
            value={s.id}
          >
            {s.code}
          </option>
        ))}
      </select>

      <button
        onClick={move}
        className="bg-blue-500 text-white px-3 py-2 rounded"
      >
        Move
      </button>
    </div>
  );
}