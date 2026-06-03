import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "canvas";
import { getThumbnailFilename, UPLOAD_DIR } from "@/lib/item-images";

const THUMBNAIL_SIZE = 240;

export async function createItemThumbnail(filename: string, source: Buffer): Promise<string> {
  const image = await loadImage(source);
  const scale = Math.max(THUMBNAIL_SIZE / image.width, THUMBNAIL_SIZE / image.height);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const left = Math.round((THUMBNAIL_SIZE - width) / 2);
  const top = Math.round((THUMBNAIL_SIZE - height) / 2);
  const canvas = createCanvas(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, left, top, width, height);

  const thumbnailFilename = getThumbnailFilename(filename);
  const thumbnailDir = path.join(UPLOAD_DIR, "thumbs");

  await mkdir(thumbnailDir, { recursive: true });
  await writeFile(path.join(thumbnailDir, thumbnailFilename), canvas.toBuffer("image/jpeg", {
    quality: 0.78,
  }));

  return thumbnailFilename;
}
