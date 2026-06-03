"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { getPrefixedPath, useIngressPath } from "@/lib/ingress-utils";
import { parseCabinetQrPayload } from "@/lib/cabinet-qr";

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [status, setStatus] = useState("Ready to scan cabinet QR codes.");
  const [isScanning, setIsScanning] = useState(false);
  const ingressPath = useIngressPath();

  useEffect(() => {
    return () => stopScanner();
  }, []);

  function stopScanner() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanning(false);
  }

  async function startScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera access is unavailable here. You can paste the QR text below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });
      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      setIsScanning(true);
      setStatus("Point the camera at a BJP Keep cabinet QR code.");

      const scan = () => {
        const currentVideo = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { willReadFrequently: true });

        if (!currentVideo || !canvas || !context || !streamRef.current) {
          return;
        }

        if (currentVideo.readyState === currentVideo.HAVE_ENOUGH_DATA) {
          canvas.width = currentVideo.videoWidth;
          canvas.height = currentVideo.videoHeight;
          context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          const cabinetId = code ? parseCabinetQrPayload(code.data) : null;

          if (code && !cabinetId) {
            setStatus("QR code found, but it is not a BJP Keep cabinet QR.");
          }

          if (cabinetId) {
            stopScanner();
            window.location.assign(getPrefixedPath(`/cabinets/${cabinetId}`, ingressPath));
            return;
          }
        }

        animationFrameRef.current = requestAnimationFrame(scan);
      };

      animationFrameRef.current = requestAnimationFrame(scan);
    } catch {
      setStatus("Camera permission was blocked or unavailable. You can paste the QR text below.");
    }
  }

  function openManualValue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("qrValue") || "");
    const cabinetId = parseCabinetQrPayload(value);

    if (!cabinetId) {
      setStatus("That QR text does not look like a BJP Keep cabinet QR code.");
      return;
    }

    window.location.assign(getPrefixedPath(`/cabinets/${cabinetId}`, ingressPath));
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded border border-[var(--border-color)] bg-black">
        <video
          ref={videoRef}
          className="aspect-[3/4] w-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startScanner}
          disabled={isScanning}
          className="rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)] disabled:opacity-50"
        >
          Start Scanner
        </button>
        <button
          type="button"
          onClick={stopScanner}
          disabled={!isScanning}
          className="rounded border border-[var(--border-color)] px-4 py-2 hover:bg-[var(--bg-hover)] disabled:opacity-50"
        >
          Stop
        </button>
      </div>

      <div className="text-sm text-[var(--text-secondary)]">{status}</div>

      <form onSubmit={openManualValue} className="space-y-2">
        <input
          name="qrValue"
          placeholder="Paste QR text"
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
