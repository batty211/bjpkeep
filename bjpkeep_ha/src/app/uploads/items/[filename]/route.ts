import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public/uploads/items");

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;

    const filepath = path.join(UPLOAD_DIR, filename);

    const file = await readFile(filepath);

    const ext = path.extname(filename).toLowerCase();

    const contentType =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
