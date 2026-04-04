import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
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
