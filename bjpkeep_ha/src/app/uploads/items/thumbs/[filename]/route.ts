import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  getOriginalFilenameFromThumbnail,
  getThumbnailFilename,
  UPLOAD_DIR,
} from "@/lib/item-images";
import { createItemThumbnail } from "@/lib/item-thumbnails";

async function findOriginalForThumbnail(thumbnailFilename: string): Promise<string | null> {
  const originalBaseName = getOriginalFilenameFromThumbnail(thumbnailFilename);
  const files = await readdir(UPLOAD_DIR);
  return files.find((file) => path.parse(file).name === originalBaseName) ?? null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const filepath = path.join(UPLOAD_DIR, "thumbs", filename);

    let file: Buffer;

    try {
      file = await readFile(filepath);
    } catch (error) {
      const originalFilename = await findOriginalForThumbnail(filename);

      if (!originalFilename) {
        throw error;
      }

      const original = await readFile(path.join(UPLOAD_DIR, originalFilename));
      await createItemThumbnail(originalFilename, original);
      file = await readFile(path.join(UPLOAD_DIR, "thumbs", getThumbnailFilename(originalFilename)));
    }

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
  }
}
