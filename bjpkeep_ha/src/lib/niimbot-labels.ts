import { createCanvas, loadImage } from "canvas";
import QRCode from "qrcode";
import { createCabinetQrPayload } from "@/lib/cabinet-qr";

type CabinetForLabel = {
  id: string;
  name: string;
  code: string;
  room: {
    name: string;
  };
};

const FONT_FAMILY = "'Noto Sans Thai', Loma, Garuda, Tahoma, sans-serif";

function setFont(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, size: number, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
}

function fitFontSize(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight = 700
) {
  let size = startSize;

  while (size > minSize) {
    setFont(ctx, size, weight);
    if (ctx.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 1;
  }

  return minSize;
}

function drawCenteredText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight = 700
) {
  const size = fitFontSize(ctx, text, maxWidth, startSize, minSize, weight);

  setFont(ctx, size, weight);
  ctx.fillText(text, x, y, maxWidth);
}

function toDataUrl(canvas: ReturnType<typeof createCanvas>) {
  return canvas.toDataURL("image/png");
}

export async function createSmallLabelImage(cabinet: CabinetForLabel) {
  const width = 240;
  const height = 96;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const subtitle = `${cabinet.room.name} / ${cabinet.name}`;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  drawCenteredText(ctx, cabinet.code, width / 2, 34, 220, 38, 20, 800);
  drawCenteredText(ctx, subtitle, width / 2, 70, 220, 23, 12, 600);

  return toDataUrl(canvas);
}

export async function createQrLabelImage(cabinet: CabinetForLabel) {
  const width = 400;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const subtitle = `${cabinet.room.name} / ${cabinet.name}`;
  const qrDataUrl = await QRCode.toDataURL(createCabinetQrPayload(cabinet.id), {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 252,
  });
  const qrImage = await loadImage(qrDataUrl);

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(qrImage, 74, 18, 252, 252);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  drawCenteredText(ctx, cabinet.code, width / 2, 308, 352, 38, 18, 800);
  drawCenteredText(ctx, subtitle, width / 2, 352, 352, 25, 13, 600);

  return toDataUrl(canvas);
}

