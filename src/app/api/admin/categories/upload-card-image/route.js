import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/adminSessionServer";
import { CATEGORY_SLUG_TO_FILE } from "@/lib/categoryCardImages";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: false });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const slug = formData.get("slug") || "category";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size (max 150 KB)
    const maxSizeBytes = 150 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size exceeds 150 KB limit (${(file.size / 1024).toFixed(1)} KB)` },
        { status: 400 }
      );
    }

    const cardsDir = join(process.cwd(), "public", "cards");
    try {
      await mkdir(cardsDir, { recursive: true });
    } catch {}

    // Determine target filename based on slug mapping
    const cleanSlug = String(slug).toLowerCase().trim();
    const filename = CATEGORY_SLUG_TO_FILE[cleanSlug] || `${cleanSlug}.webp`;
    const filepath = join(cardsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const cardUrl = `/cards/${filename}`;

    return NextResponse.json({
      success: true,
      url: cardUrl,
      filename,
    });
  } catch (error) {
    console.error("Card image upload error:", error);
    return NextResponse.json({ error: "Failed to upload card image: " + error.message }, { status: 500 });
  }
}
