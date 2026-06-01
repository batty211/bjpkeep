"use client";

import { useState } from "react";

type Shelf = {
  id: string;
  code: string;
};

export default function ItemForm({
  shelves,
  initialData,
}: {
  shelves: Shelf[];
  initialData?: {
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    shelfId: string;
  };
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [quantity, setQuantity] = useState(initialData?.quantity ?? 1);
  const [unit, setUnit] = useState(initialData?.unit ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [shelfId, setShelfId] = useState(initialData?.shelfId ?? "");
  const [file, setFile] =
  useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    let imagePath = "";

if (file) {
  const fd = new FormData();

  fd.append("file", file);

  const upload =
    await fetch(
      "/api/upload",
      {
        method: "POST",
        body: fd,
      }
    );

  const uploaded =
    await upload.json();

  imagePath =
    uploaded.path;
}
    const method = initialData?.id ? "PUT" : "POST";

    const response = await fetch("/api/items", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: initialData?.id,
        name,
        quantity,
        unit,
        category,
        shelfId,
        imagePath,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to save item");
      return;
    }

    if (initialData?.id) {
      window.location.href = `/items/${initialData.id}`;
      return;
    }

    alert("Item created successfully");
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
<input
  type="file"
  className="mb-2 w-full"
  onChange={(e) =>
    setFile(
      e.target.files?.[0] ?? null
    )
  }
/>
      <button
        onClick={save}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : initialData
            ? "Save Changes"
            : "Save"}
      </button>
    </div>
  );
}