// app/api/admin/upload/route.ts
// POST — upload product image to Cloudinary

import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });

    // Validate file type
    if (!file.type.startsWith("image/"))
      return NextResponse.json({ success: false, error: "Only image files are allowed" }, { status: 400 });

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ success: false, error: "Image must be under 5MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(buffer, "souk-fashion-house/products");

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
