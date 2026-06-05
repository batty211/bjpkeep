"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPrefixedPath, useIngressPath } from "@/lib/ingress-utils";

export default function InventoryFilter({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const ingressPath = useIngressPath();
  const searchParams = useSearchParams();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }

    params.set("page", "1");

    const prefixedPath = getPrefixedPath("/inventory", ingressPath);
    const query = params.toString();
    window.location.href = query ? `${prefixedPath}?${query}` : prefixedPath;
  }

  return (
    <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="🔍 Search items..."
        className="min-w-0 flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[var(--foreground)]"
      />

      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded bg-black px-4 py-2 text-sm text-white sm:flex-none">
          Search
        </button>

        {initialValue && (
          <button
            type="button"
            className="flex-1 rounded border border-[var(--border-color)] px-4 py-2 text-sm sm:flex-none"
            onClick={() => {
              setValue("");
              const prefixedPath = getPrefixedPath("/inventory", ingressPath);
              window.location.href = prefixedPath;
            }}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
