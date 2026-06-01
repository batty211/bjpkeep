"use client";

import { useState } from "react";
import Link from "next/link";

export default function ItemSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [roomFilter, setRoomFilter] = useState("");
  const [shelfFilter, setShelfFilter] = useState("");

  async function search() {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    setItems(data);
  }

  const filteredItems = items.filter((item) => {
    const roomMatch = roomFilter
      ? item.shelf.cabinet.room.name
          .toLowerCase()
          .includes(roomFilter.toLowerCase())
      : true;

    const shelfMatch = shelfFilter
      ? item.shelf.code
          .toLowerCase()
          .includes(shelfFilter.toLowerCase())
      : true;

    return roomMatch && shelfMatch;
  });

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 font-semibold">
        🔍 Search Items
      </h2>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded border p-2"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              search();
            }
          }}
          placeholder="ค้นหาชื่อสินค้า หรือหมวดหมู่..."
        />

        <button
          onClick={search}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Search
        </button>

        <button
          onClick={() => {
            setQuery("");
            setItems([]);
          }}
          className="rounded border px-4 py-2"
        >
          Clear
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded border p-2"
          placeholder="Filter Room"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        />

        <input
          className="flex-1 rounded border p-2"
          placeholder="Filter Shelf"
          value={shelfFilter}
          onChange={(e) => setShelfFilter(e.target.value)}
        />
      </div>

      {filteredItems.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Found {filteredItems.length} item(s)
        </div>
      )}

      <div className="mt-4 space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded border p-3 transition hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/items/${item.id}`}
                className="min-w-0 flex-1"
              >
                <div className="font-medium">
                  {item.name}
                </div>

                <div className="text-sm font-medium text-blue-600">
                  📍 {item.shelf.cabinet.room.name} &gt; {item.shelf.cabinet.code} &gt; {item.shelf.code}
                </div>
              </Link>

              <Link
                href={`/items/${item.id}/edit`}
                className="rounded border px-3 py-1 text-sm"
              >
                ✏️ Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}