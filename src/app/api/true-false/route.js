import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const omitQuestionId = searchParams.get("omitQuestionId");
    
    const whereClause = {
      hidden: false,
      ...(categoryId && { categoryId }),
      ...(omitQuestionId && { id: { not: omitQuestionId } }),
    };

    const count = await prisma.trueFalseQuestion.count({ where: whereClause });
    if (count === 0) {
      // If we fall back because of omitQuestionId, retry without omit
      if (omitQuestionId) {
        const anyCount = await prisma.trueFalseQuestion.count({ 
          where: { hidden: false, categoryId: categoryId || undefined } 
        });
        if (anyCount > 0) {
          const skip = Math.floor(Math.random() * anyCount);
          const question = await prisma.trueFalseQuestion.findFirst({
            where: { hidden: false, categoryId: categoryId || undefined },
            skip,
            include: { category: true }
          });
          return NextResponse.json({ question }, { status: 200 });
        }
      }
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * count);
    const question = await prisma.trueFalseQuestion.findFirst({
      where: whereClause,
      skip,
      include: { category: true }
    });

    // Increment views
    await prisma.trueFalseQuestion.update({
      where: { id: question.id },
      data: { views: { increment: 1 } }
    });

    return NextResponse.json({ question }, { status: 200 });
  } catch (error) {
    console.error("True/False GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { questionId, userAnswer, language = "en" } = body;

    if (!questionId || userAnswer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const question = await prisma.trueFalseQuestion.findUnique({
      where: { id: questionId },
      include: { category: true }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = userAnswer === question.correctAnswer;
    
    // Prepare response based on language
    const response = {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: language === "hi" && question.explanationHi ? question.explanationHi : question.explanation,
      statement: language === "hi" && question.statementHi ? question.statementHi : question.statement,
      category: {
        name: language === "hi" && question.category.nameHi ? question.category.nameHi : question.category.name,
        slug: question.category.slug
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("True/False POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
