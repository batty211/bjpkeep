"use client";

import { useState } from "react";

export default function UploadImageForm({ itemId }: { itemId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadImage() {
    if (!file) {
      alert("Please select an image");
      return;
    }

    setLoading(true);

    try {
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

      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold">Upload More Images</h2>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Photo</label>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed p-3 transition hover:bg-gray-50">
          <span className="truncate text-sm text-gray-600">{fileName || "Choose image..."}</span>

          <span className="rounded bg-black px-3 py-1 text-sm text-white">Browse</span>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              setFileName(selected?.name ?? "");
            }}
          />
        </label>
      </div>

      <button
        onClick={uploadImage}
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}
