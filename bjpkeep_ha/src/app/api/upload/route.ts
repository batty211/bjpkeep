import { writeFile, mkdir } from "fs/promises";
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public/uploads/items");

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      {
        error: "File too large. Maximum size is 10MB.",
      },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop();

  const filename = `${uuid()}.${ext}`;

  const filepath = path.join(UPLOAD_DIR, filename);

  await mkdir(UPLOAD_DIR, { recursive: true });

  try {
    await writeFile(filepath, buffer);

    return NextResponse.json({
      path: `/uploads/items/${filename}`,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to save file",
      },
      { status: 500 }
    );
  }
}
