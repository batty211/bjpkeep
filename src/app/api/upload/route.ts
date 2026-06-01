import { writeFile } from "fs/promises";
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get(
    "file"
  ) as File;

  if (!file) {
    return NextResponse.json(
      { error: "No file" },
      { status: 400 }
    );
  }

  const bytes =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(bytes);

  const ext =
    file.name.split(".").pop();

  const filename =
    `${uuid()}.${ext}`;

  const filepath = path.join(
    process.cwd(),
    "public/uploads/items",
    filename
  );

  await writeFile(
    filepath,
    buffer
  );

  return NextResponse.json({
    path: `/uploads/items/${filename}`,
  });
}