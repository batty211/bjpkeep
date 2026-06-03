import path from "node:path";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public/uploads/items");

export function getThumbnailFilename(filename: string): string {
  return `${path.parse(filename).name}.jpg`;
}

export function getThumbnailPath(imagePath: string): string {
  const filename = path.basename(imagePath);
  return `/uploads/items/thumbs/${getThumbnailFilename(filename)}`;
}

export function getOriginalFilenameFromThumbnail(filename: string): string {
  return path.parse(filename).name;
}
