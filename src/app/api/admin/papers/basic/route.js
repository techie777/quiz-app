import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const papers = await prisma.mockPaper.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        examId: true,
        timeLimit: true,
        totalMarks: true,
        isLive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(papers);
  } catch (err) {
    console.error("Error in /api/admin/papers/basic:", err);
    return NextResponse.json({ error: "Failed to fetch mock papers" }, { status: 500 });
  }
}
