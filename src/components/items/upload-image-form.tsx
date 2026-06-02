"use client";

import { useState } from "react";

export default function UploadImageForm({ itemId }: { itemId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadImage() {
    if (files.length === 0) {
      alert("Please select at least one image");
      return;
    }

    setLoading(true);

    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        const uploaded = await uploadRes.json();

        await fetch("/api/items/add-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId,
            path: uploaded.path,
          }),
        });
      }

      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <h2 className="mb-4 text-lg font-semibold">Upload More Images</h2>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Photo</label>

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
        onClick={uploadImage}
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Images"}
      </button>
    </div>
  );
}
