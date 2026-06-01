"use client";

import { useState } from "react";

export default function ItemForm({
  initialData,
  cabinetId,
  cabinets,
}: {
  cabinetId?: string;
  cabinets: { id: string; name?: string; code?: string }[];
  initialData?: {
    id?: string;
    name: string;
  };
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [cabinetIdState, setCabinetIdState] = useState(
    initialData?.cabinetId ?? ""
  );
  const isFromQR = !!cabinetId;
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
        cabinetId: cabinetIdState,
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

      <select
        className="mb-2 w-full rounded border p-2"
        value={cabinetIdState}
        onChange={(e) => setCabinetIdState(e.target.value)}
        disabled={isFromQR}
      >
        <option value="">Select Cabinet</option>
        {cabinets.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code ?? c.name}
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