"use client";

import { useState } from "react";

export default function ItemSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);

  async function search() {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    setItems(data);
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 font-semibold">
        Search
      </h2>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded border p-2"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
        />

        <button
          onClick={search}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Search
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded border p-3"
          >
            <div className="font-medium">
              {item.name}
            </div>

            <div className="text-sm text-gray-500">
              {item.shelf.code}
            </div>

            <div className="text-sm text-gray-500">
              {item.shelf.cabinet.room.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}