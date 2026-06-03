"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrefixedFetch, getPrefixedPath, useIngressPath } from "@/lib/ingress-utils";

export default function ItemForm({
  initialData,
  cabinetId,
  cabinets,
  stayOnCreate = false,
}: {
  cabinetId?: string;
  stayOnCreate?: boolean;
  cabinets: {
    id: string;
    name?: string;
    code?: string;
    room?: {
      name: string;
    };
  }[];
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
  const [message, setMessage] = useState("");
  const prefixedFetch = usePrefixedFetch();
  const ingressPath = useIngressPath();
  const router = useRouter();

  async function save() {
    if (!name || !cabinetIdState) {
      alert("Please fill in all fields");
      return;
    }

    setSaving(true);
    const imagePaths: string[] = [];

    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);

        const upload = await prefixedFetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        if (!upload.ok) throw new Error("Upload failed");
        const uploaded = await upload.json();
        imagePaths.push(uploaded.path);
      }

      const method = initialData?.id ? "PUT" : "POST";
      const response = await prefixedFetch("/api/items", {
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

      if (!response.ok) {
        throw new Error("Failed to save item");
      }

      const createdItem = !initialData?.id ? await response.json() : null;

      if (createdItem && imagePaths.length > 1) {
        for (let i = 1; i < imagePaths.length; i++) {
          await prefixedFetch("/api/items/add-image", {
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
        window.location.href = getPrefixedPath(`/items/${initialData.id}`, ingressPath);
        return;
      }

      if (stayOnCreate) {
        setName("");
        setFiles([]);
        setFileName("");
        setMessage(`Added ${createdItem?.name ?? "item"}.`);
        router.refresh();
        return;
      }

      alert("Item created successfully");
      location.reload();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <h2 className="mb-4 font-semibold">Add Item</h2>

      <input
        className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
        placeholder="Item Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {isFromQR && (
        <div className="mb-2 rounded border border-[var(--border-color)] bg-[var(--bg-hover)] p-2 text-sm">
          Cabinet:{" "}
          {(() => {
            const cabinet = cabinets.find((c) => c.id === cabinetId);
            return cabinet
              ? [cabinet.room?.name, cabinet.code, cabinet.name].filter(Boolean).join(" > ")
              : "Selected Cabinet";
          })()}
        </div>
      )}

      {!isFromQR && (
        <select
          className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
          value={cabinetIdState}
          onChange={(e) => setCabinetIdState(e.target.value)}
        >
          <option value="">Select Cabinet</option>
          {cabinets.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.room?.name, c.code, c.name].filter(Boolean).join(" > ")}
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

      {message && (
        <div className="mt-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
          {message}
        </div>
      )}
    </div>
  );
}
