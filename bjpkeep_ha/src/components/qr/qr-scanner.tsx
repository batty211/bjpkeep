"use client";

import jsQR from "jsqr";
import { useRef, useState } from "react";
import { getPrefixedPath, prefixedFetch, useIngressPath } from "@/lib/ingress-utils";
import { parseCabinetQrPayload } from "@/lib/cabinet-qr";

export default function QrScanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Take or choose a cabinet QR photo.");
  const ingressPath = useIngressPath();

  function openCabinet(cabinetId: string) {
    window.location.assign(getPrefixedPath(`/cabinets/${cabinetId}`, ingressPath));
  }

  function decodeImageSource(source: CanvasImageSource, width: number, height: number): string | null {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!canvas || !context) {
      return null;
    }

    const maxSize = 1200;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    return code?.data ?? null;
  }

  async function decodeQrImage(file: File) {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    try {
      const decodedValue = await new Promise<string | null>((resolve) => {
        image.onload = () => {
          resolve(decodeImageSource(image, image.naturalWidth, image.naturalHeight));
        };
        image.onerror = () => resolve(null);
        image.src = objectUrl;
      });
      const cabinetId = decodedValue ? parseCabinetQrPayload(decodedValue) : null;

      if (!decodedValue) {
        setStatus("No QR code found in that photo. Try taking a closer, sharper photo.");
        return;
      }

      if (!cabinetId) {
        setStatus("QR code found, but it is not a BJP Keep cabinet QR.");
        return;
      }

      openCabinet(cabinetId);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function handleQrImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void decodeQrImage(file);
  }

  async function openManualValue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("cabinetCode") || "").trim();
    const cabinetId = parseCabinetQrPayload(value);

    if (!value) {
      setStatus("Enter a cabinet code first.");
      return;
    }

    if (cabinetId) {
      openCabinet(cabinetId);
      return;
    }

    const response = await prefixedFetch(`/api/cabinets?code=${encodeURIComponent(value)}`);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(result.error ?? "Cabinet code not found.");
      return;
    }

    openCabinet(result.id);
  }

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      <label className="block cursor-pointer rounded border border-[var(--border-color)] px-4 py-3 text-center font-medium hover:bg-[var(--bg-hover)]">
        📷 Scan Cabinet QR
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleQrImage}
          className="hidden"
        />
      </label>

      <div className="text-sm text-[var(--text-secondary)]">{status}</div>

      <form onSubmit={openManualValue} className="space-y-2">
        <input
          name="cabinetCode"
          placeholder="Enter Cabinet Code"
          className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-[var(--foreground)]"
        />
        <button
          type="submit"
          className="rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)]"
        >
          Open Cabinet
        </button>
      </form>
    </div>
  );
}
