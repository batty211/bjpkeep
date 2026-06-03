"use client";

import { useRouter } from "next/navigation";
import { prefixedFetch } from "@/lib/ingress-utils";

export default function DeleteImageButton({
  imageId,
}: {
  imageId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this image?")) {
      return;
    }

    const res = await prefixedFetch("/api/items/delete-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageId }),
    });

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="w-full rounded bg-red-600 py-1 text-xs text-white"
    >
      🗑 Delete
    </button>
  );
}
