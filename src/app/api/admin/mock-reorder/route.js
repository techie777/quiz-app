import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const { model, items } = await request.json();

    if (!model || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const validModels = ['category', 'exam', 'paper', 'question'];
    if (!validModels.includes(model)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    // Map model names to Prisma models
    const modelMap = {
      'category': prisma.mockCategory,
      'exam': prisma.mockExam,
      'paper': prisma.mockPaper,
      'question': prisma.mockQuestion
    };

    const prismaModel = modelMap[model];

    // Use a transaction for atomic bulk updates
    await prisma.$transaction(
      items.map((item) =>
        prismaModel.update({
          where: { id: item.id },
          data: { sortOrder: Number(item.sortOrder) }
        })
      )
    );

    // Activity Log
    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: `reorder_${model}`,
        details: `Reordered ${items.length} ${model}s`
      }
    });

    return NextResponse.json({ success: true, message: `Successfully reordered ${items.length} ${model}s` });
  } catch (error) {
    console.error("Bulk Reorder Error:", error);
    return NextResponse.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}
