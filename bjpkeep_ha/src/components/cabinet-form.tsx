"use client";

import { useState } from "react";
import { prefixedFetch } from "@/lib/ingress-utils";

type Room = {
  id: string;
  name: string;
  code?: string;
};

export default function CabinetForm({
  rooms,
  initialData,
}: {
  rooms: Room[];
  initialData?: {
    id: string;
    roomId: string;
    name: string;
    code: string;
  };
}) {
  const [roomId, setRoomId] = useState(initialData?.roomId ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [saving, setSaving] = useState(false);

  const selectedRoom = rooms.find((room) => room.id === roomId);

  const generatedPreview = selectedRoom?.code ? `${selectedRoom.code}-CXX` : "Select a room first";

  async function save() {
    if (!roomId || !name.trim()) {
      alert("Please select a room and fill in cabinet name");
      return;
    }

    if (initialData && !code.trim()) {
      alert("Please fill in cabinet code");
      return;
    }

    setSaving(true);

    const res = await prefixedFetch("/api/cabinets", {
      method: initialData ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: initialData?.id,
        roomId,
        name,
        code,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Failed to save cabinet" }));
      alert(error.error ?? "Failed to save cabinet");
      return;
    }

    location.reload();
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <h2 className="mb-4 font-semibold">{initialData ? "Edit Cabinet" : "Add Cabinet"}</h2>

      <select
        className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      >
        <option value="">Select Room</option>

        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>

      <input
        className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
        placeholder="Cabinet Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
        placeholder="Leave blank for auto-generated code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      {!initialData && (
        <p className="mb-1 text-sm text-[var(--text-secondary)]">
          Leave blank to auto-generate from the selected room.
        </p>
      )}

      {!initialData && !code && (
        <p className="mb-2 text-sm text-blue-600">Generated code: {generatedPreview}</p>
      )}

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
