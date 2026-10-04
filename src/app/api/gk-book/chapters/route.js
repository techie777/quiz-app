import { NextResponse } from "next/server";
import { getGkBookTree, saveGkBookChapter } from "@/lib/gk-book/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/gk-book/chapters
 * Returns the hierarchical taxonomy tree and chapter catalog
 */
export async function GET(request) {
  try {
    const tree = await getGkBookTree();
    return NextResponse.json({
      success: true,
      tree,
    });
  } catch (err) {
    console.error("[api/gk-book/chapters] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load GK Book tree" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gk-book/chapters
 * Upserts a chapter and its pages
 */
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.titleHi && !body.title) {
      return NextResponse.json(
        { success: false, error: "Chapter title (Hindi) is required" },
        { status: 400 }
      );
    }

    const result = await saveGkBookChapter(body);
    return NextResponse.json({
      success: true,
      slug: result.slug,
      message: "Chapter saved successfully",
    });
  } catch (err) {
    console.error("[api/gk-book/chapters] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save chapter" },
      { status: 500 }
    );
  }
}
