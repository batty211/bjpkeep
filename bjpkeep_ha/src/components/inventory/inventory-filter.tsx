"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPrefixedPath, useIngressPath } from "@/lib/ingress-utils";

export default function InventoryFilter({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const firstRender = useRef(true);
  const ingressPath = useIngressPath();

  const searchParams = useSearchParams();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (value === initialValue) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      params.set("page", "1");

      const prefixedPath = getPrefixedPath("/inventory", ingressPath);
      window.location.replace(`${prefixedPath}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, initialValue, searchParams, ingressPath]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="🔍 Search items..."
      className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[var(--foreground)]"
    />
  );
}
