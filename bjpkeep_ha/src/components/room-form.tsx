"use client";

import { useState } from "react";
import { prefixedFetch } from "@/lib/ingress-utils";

export default function RoomForm({
  initialData,
}: {
  initialData?: {
    id: string;
    name: string;
    code: string;
  };
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || !code.trim()) {
      alert("Please fill in room name and code");
      return;
    }

    setSaving(true);

    const res = await prefixedFetch("/api/rooms", {
      method: initialData ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: initialData?.id,
        name,
        code,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Failed to save room" }));
      alert(error.error ?? "Failed to save room");
      return;
    }

    location.reload();
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <h2 className="mb-4 font-semibold">{initialData ? "Edit Room" : "Add Room"}</h2>

      <input
        className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
        placeholder="Room Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
        placeholder="Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={save}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
