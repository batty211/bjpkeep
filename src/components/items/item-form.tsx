"use client";

import { useState } from "react";

type Shelf = {
  id: string;
  code: string;
};

export default function ItemForm({
  shelves,
}: {
  shelves: Shelf[];
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [shelfId, setShelfId] = useState("");

  async function save() {
    await fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        quantity,
        unit,
        category,
        shelfId,
      }),
    });

    location.reload();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 font-semibold">
        Add Item
      </h2>

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Item Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <input
        type="number"
        className="mb-2 w-full rounded border p-2"
        value={quantity}
        onChange={(e) =>
          setQuantity(Number(e.target.value))
        }
      />

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Unit"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
      />

      <select
        className="mb-2 w-full rounded border p-2"
        value={shelfId}
        onChange={(e) => setShelfId(e.target.value)}
      >
        <option value="">
          Select Shelf
        </option>

        {shelves.map((shelf) => (
          <option
            key={shelf.id}
            value={shelf.id}
          >
            {shelf.code}
          </option>
        ))}
      </select>

      <button
        onClick={save}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Save
      </button>
    </div>
  );
}