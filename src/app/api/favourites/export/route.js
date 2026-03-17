import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favourites = await prisma.favourite.findMany({
    where: { userId: session.user.id },
    include: { question: { include: { category: true } } },
    orderBy: { question: { categoryId: "asc" } },
  });

  // Get company settings
  const settingsRows = await prisma.setting.findMany({
    where: { key: { in: ["companyName", "companyWebsite"] } },
  });
  const settings = {};
  settingsRows.forEach((r) => (settings[r.key] = r.value));

  // Group by category
  const grouped = {};
  for (const f of favourites) {
    const catId = f.question.category.id;
    if (!grouped[catId]) {
      grouped[catId] = {
        topic: f.question.category.topic,
        emoji: f.question.category.emoji,
        questions: [],
      };
    }
    grouped[catId].questions.push({
      text: f.question.text,
      correctAnswer: f.question.correctAnswer,
    });
  }

  return NextResponse.json({
    companyName: settings.companyName || "QuizWeb",
    companyWebsite: settings.companyWebsite || "",
    categories: Object.values(grouped),
  });
}
