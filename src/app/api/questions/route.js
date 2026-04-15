import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { requireAdmin } from "@/lib/adminSessionServer";
import { enforceRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const rl = enforceRateLimit(rateLimitKey(request, "api:questions:get"), { windowMs: 60_000, max: 60 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds);

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const where = {};
  if (categoryId) where.categoryId = categoryId;

  // Hard cap to reduce scraping surface
  const take = Math.min(parseInt(searchParams.get("limit") || "200", 10) || 200, 200);
  const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

  const questions = await prisma.question.findMany({
    where,
    include: { category: true },
    take,
    skip,
  });
  return NextResponse.json(
    questions.map((q) => ({ ...q, options: safeJsonParse(q.options) }))
  );
}

export async function POST(request) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  console.log("[API/Questions] POST request received");
  try {
    const body = await request.json();
    console.log("[API/Questions] Request body:", JSON.stringify(body, null, 2));
    const { text, options, correctAnswer, difficulty, image, categoryId } = body;
    
    if (!text || !options || !correctAnswer || !categoryId) {
      console.error("[API/Questions] Validation failed: missing required fields", { text: !!text, options: !!options, correctAnswer: !!correctAnswer, categoryId: !!categoryId });
      return NextResponse.json({ error: "Missing required fields (text, options, correctAnswer, categoryId)" }, { status: 400 });
    }

    // Validate categoryId format for MongoDB
    if (typeof categoryId === "string" && categoryId.length !== 24) {
      console.error("[API/Questions] Invalid categoryId format. Must be a 24-character hex string. Received:", categoryId);
      return NextResponse.json({ error: `Invalid categoryId format: "${categoryId}". Must be a 24-character hex string for MongoDB.` }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        text,
        options: JSON.stringify(options),
        correctAnswer,
        difficulty: difficulty || "easy",
        image: image || null,
        categoryId,
      },
    });
    console.log("[API/Questions] Question created successfully:", question.id);
    return NextResponse.json({ ...question, options: safeJsonParse(question.options) }, { status: 201 });
  } catch (error) {
    console.error("[API/Questions] POST error:", error);
    return NextResponse.json({ error: "Failed to create question: " + error.message }, { status: 500 });
  }
}
