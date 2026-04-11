import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper function to check admin permissions
async function checkAdminAuth() {
  const session = await getServerSession(adminAuthOptions);
  if (!session?.user?.isAdmin) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }
  return { authorized: true, session };
}

// GET - Fetch categories and questions
export async function GET(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'categories' or 'questions'
    const categoryId = searchParams.get("categoryId");

    if (type === "categories") {
      const categories = await prisma.trueFalseCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        }
      });
      return NextResponse.json({ categories }, { status: 200 });
    }

    if (type === "questions") {
      const whereClause = categoryId ? { categoryId } : {};
      const questions = await prisma.trueFalseQuestion.findMany({
        where: whereClause,
        include: { category: true },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ questions }, { status: 200 });
    }

    // Return both if no type specified
    const categories = await prisma.trueFalseCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      }
    });

    const questions = await prisma.trueFalseQuestion.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ categories, questions }, { status: 200 });
  } catch (error) {
    console.error("Admin True/False GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create categories or questions
export async function POST(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === "category") {
      const { name, nameHi, slug, image, sortOrder } = data;
      
      const category = await prisma.trueFalseCategory.create({
        data: {
          name,
          nameHi,
          slug,
          image,
          sortOrder: sortOrder || 0
        }
      });

      return NextResponse.json({ category }, { status: 201 });
    }

    if (type === "question") {
      const { categoryId, statement, statementHi, correctAnswer, explanation, explanationHi, image } = data;
      
      const question = await prisma.trueFalseQuestion.create({
        data: {
          categoryId,
          statement,
          statementHi,
          correctAnswer,
          explanation,
          explanationHi,
          image
        },
        include: { category: true }
      });

      return NextResponse.json({ question }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin True/False POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update categories or questions
export async function PUT(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { type, id, ...data } = body;

    if (type === "category") {
      const category = await prisma.trueFalseCategory.update({
        where: { id },
        data
      });

      return NextResponse.json({ category }, { status: 200 });
    }

    if (type === "question") {
      const question = await prisma.trueFalseQuestion.update({
        where: { id },
        data,
        include: { category: true }
      });

      return NextResponse.json({ question }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin True/False PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete categories or questions
export async function DELETE(request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    if (type === "category") {
      await prisma.trueFalseCategory.delete({
        where: { id }
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (type === "question") {
      await prisma.trueFalseQuestion.delete({
        where: { id }
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin True/False DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
