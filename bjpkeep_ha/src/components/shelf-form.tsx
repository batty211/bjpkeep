"use client";

import { useState } from "react";
import { prefixedFetch } from "@/lib/ingress-utils";

type Cabinet = {
  id: string;
  name: string;
  code: string;
};

export default function ShelfForm({
  cabinets,
}: {
  cabinets: Cabinet[];
}) {
  const [cabinetId, setCabinetId] = useState("");
  const [code, setCode] = useState("");

  async function save() {
    await prefixedFetch("/api/shelves", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cabinetId,
        code,
      }),
    });

    location.reload();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-4 font-semibold">
        Add Shelf
      </h2>

      <select
        className="mb-2 w-full rounded border p-2"
        value={cabinetId}
        onChange={(e) => setCabinetId(e.target.value)}
      >
        <option value="">
          Select Cabinet
        </option>

        {cabinets.map((cabinet) => (
          <option
            key={cabinet.id}
            value={cabinet.id}
          >
            {cabinet.code}
          </option>
        ))}
      </select>

      <input
        className="mb-2 w-full rounded border p-2"
        placeholder="K01-01"
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