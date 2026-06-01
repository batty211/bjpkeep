"use client";

import { useState } from "react";

type Room = {
  id: string;
  name: string;
  code?: string;
};

export default function CabinetForm({
  rooms,
}: {
  rooms: Room[];
}) {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const selectedRoom = rooms.find(
    (room) => room.id === roomId
  );

  const generatedPreview = selectedRoom?.code
    ? `${selectedRoom.code}-CXX`
    : "Select a room first";

  async function save() {
    await fetch("/api/cabinets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        name,
        code,
      }),
    });

    location.reload();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 font-semibold">
        Add Cabinet
      </h2>

      <select
        className="mb-2 w-full rounded border p-2"
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
        className="mb-2 w-full rounded border p-2"
        placeholder="Cabinet Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Leave blank for auto-generated code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <p className="mb-1 text-sm text-gray-500">
        Leave blank to auto-generate from the selected room.
      </p>

      {!code && (
        <p className="mb-2 text-sm text-blue-600">
          Generated code: {generatedPreview}
        </p>
      )}

      <button
        onClick={save}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Save
      </button>
    </div>
  );
}