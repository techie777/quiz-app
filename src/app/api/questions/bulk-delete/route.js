import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const adminCheck = await requireAdmin({ masterOnly: true });
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const { questionIds } = await request.json();
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: "Invalid questionIds" }, { status: 400 });
    }

    // Delete associated favorites first to avoid foreign key/relation issues
    await prisma.favourite.deleteMany({
      where: {
        questionId: {
          in: questionIds
        }
      }
    });

    const result = await prisma.question.deleteMany({
      where: {
        id: {
          in: questionIds
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    });
  } catch (error) {
    console.error("[BulkDelete] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
