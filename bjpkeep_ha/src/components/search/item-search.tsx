"use client";

import { useEffect, useState } from "react";
import MoveItemForm from "@/components/items/move-item-form";
import Link from "next/link";

export default function ItemSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  useEffect(() => {
    async function loadCabinets() {
      const res = await fetch("/api/cabinets");
      const data = await res.json();
      setCabinets(data);
    }

    loadCabinets();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setItems([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);

      const data = await res.json();

      setItems(data);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  async function search() {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

    const data = await res.json();

    setItems(data);
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <h2 className="mb-4 font-semibold">🔍 Search Items</h2>

      <div className="relative">
        <input
          className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 pr-10 text-[var(--foreground)]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              search();
            }
          }}
          placeholder="พิมพ์เพื่อค้นหาทันที..."
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setItems([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          >
            ✕
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 text-sm text-[var(--text-secondary)]">
          Found {items.length} item(s)
        </div>
      )}

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded border border-[var(--border-color)] p-3 transition hover:bg-[var(--bg-hover)]"
          >
            <div className="flex items-start justify-between gap-2">
              <Link href={`/items/${item.id}`} className="min-w-0 flex-1">
                <div className="font-medium">{item.name}</div>

                <div className="text-sm font-medium text-blue-600">
                  📍 {item.cabinet.room.name} → {item.cabinet.name} ({item.cabinet.code})
                </div>
              </Link>

              <div className="relative flex gap-2">
                <details>
                  <summary className="cursor-pointer rounded border px-3 py-1 text-sm list-none">
                    📦 Move
                  </summary>
                  <div className="absolute right-0 z-10 mt-2 w-80 rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-3 shadow-lg">
                    <MoveItemForm itemId={item.id} cabinets={cabinets} />
                  </div>
                </details>
                <Link href={`/items/${item.id}/edit`} className="rounded border px-3 py-1 text-sm">
                  ✏️ Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
