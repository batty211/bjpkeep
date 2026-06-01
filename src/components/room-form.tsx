"use client";

import { useState } from "react";

export default function RoomForm() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  async function save() {
    await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        code,
      }),
    });

    location.reload();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 font-semibold">
        Add Room
      </h2>

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Room Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={save}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Save
      </button>
    </div>
  );
}