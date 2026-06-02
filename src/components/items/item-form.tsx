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
    cabinetId?: string;
  };
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [cabinetIdState, setCabinetIdState] = useState(cabinetId ?? initialData?.cabinetId ?? "");
  const isFromQR = !!cabinetId;
  const [files, setFiles] = useState<File[]>([]);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const imagePaths: string[] = [];

    for (const file of files) {
      const fd = new FormData();

      fd.append("file", file);

      const upload = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const uploaded = await upload.json();

      imagePaths.push(uploaded.path);
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
        imagePath: imagePaths[0] ?? "",
      }),
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to save item");
      return;
    }

    if (!initialData?.id && imagePaths.length > 1) {
      const createdItem = await response.json();

      for (let i = 1; i < imagePaths.length; i++) {
        await fetch("/api/items/add-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: createdItem.id,
            path: imagePaths[i],
          }),
        });
      }
    }

    if (initialData?.id) {
      window.location.href = `/items/${initialData.id}`;
      return;
    }

    alert("Item created successfully");
    location.reload();
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <h2 className="mb-4 font-semibold">Add Item</h2>

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Item Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {isFromQR && (
        <div className="mb-2 rounded border border-[var(--border-color)] bg-[var(--bg-hover)] p-2 text-sm">
          Cabinet: {cabinets.find((c) => c.id === cabinetId)?.code ?? "Selected Cabinet"}
        </div>
      )}

      {!isFromQR && (
        <select
          className="mb-2 w-full rounded border p-2"
          value={cabinetIdState}
          onChange={(e) => setCabinetIdState(e.target.value)}
        >
          <option value="">Select Cabinet</option>
          {cabinets.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code ?? c.name}
            </option>
          ))}
        </select>
      )}

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Photo (optional)
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--border-color)] border-dashed p-3 transition hover:bg-[var(--bg-hover)]">
          <span className="truncate text-sm text-[var(--text-secondary)]">
            {fileName || "Choose image..."}
          </span>

          <span className="rounded bg-black px-3 py-1 text-sm text-white">Browse</span>

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              setFiles(selected);
              setFileName(selected.length > 0 ? `${selected.length} image(s) selected` : "");
            }}
          />
        </label>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : initialData ? "Save Changes" : "Save"}
      </button>
    </div>
  );
}
