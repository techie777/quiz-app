import { NextResponse } from "next/server";
import { getGkBookChapter } from "@/lib/gk-book/db";
import { getDb } from "@/lib/mongoDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/gk-book/chapters/[slug]
 * Returns chapter details with all pages and content blocks
 */
export async function GET(request, context) {
  try {
    const params = await (context?.params || {});
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Chapter slug is required" },
        { status: 400 }
      );
    }

    const chapter = await getGkBookChapter(slug);
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chapter,
    });
  } catch (err) {
    console.error("[api/gk-book/chapters/[slug]] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load chapter" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gk-book/chapters/[slug]
 * Removes a chapter and its associated pages
 */
export async function DELETE(request, context) {
  try {
    const params = await (context?.params || {});
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Chapter slug is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    await db.collection("gk_book_chapters").deleteOne({ slug });
    await db.collection("gk_book_pages").deleteMany({ chapterSlug: slug });
    await db.collection("gk_book_progress").deleteMany({ chapterSlug: slug });

    return NextResponse.json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (err) {
    console.error("[api/gk-book/chapters/[slug]] DELETE error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
