import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const where = {};
  if (categoryId) where.categoryId = categoryId;

  const questions = await prisma.question.findMany({ where, include: { category: true } });
  return NextResponse.json(
    questions.map((q) => ({ ...q, options: safeJsonParse(q.options) }))
  );
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
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
