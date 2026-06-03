import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR } from "@/lib/item-images";

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const filepath = path.join(UPLOAD_DIR, filename);
    const file = await readFile(filepath);

    const ext = path.extname(filename).toLowerCase();

    const contentType =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
