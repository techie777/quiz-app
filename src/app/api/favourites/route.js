import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.isAdmin) {
      return NextResponse.json([], { status: 200 });
    }
    const favourites = await prisma.favourite.findMany({
      where: { userId: session.user.id },
      include: {
        question: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      favourites.map((f) => ({
        ...f,
        question: { ...f.question, options: safeJsonParse(f.question.options) },
      }))
    );
  } catch (error) {
    console.error("Favourites GET error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { questionId } = await request.json();
    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }
    // Toggle: if exists, remove; if not, add
    const existing = await prisma.favourite.findUnique({
      where: { userId_questionId: { userId: session.user.id, questionId } },
    });
    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favourited: false });
    }
    await prisma.favourite.create({
      data: { userId: session.user.id, questionId },
    });
    return NextResponse.json({ favourited: true });
  } catch (error) {
    console.error("Favourites POST error:", error);
    return NextResponse.json({ error: "Failed to toggle favourite" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { questionId } = await request.json();
  await prisma.favourite.deleteMany({
    where: { userId: session.user.id, questionId },
  });
  return NextResponse.json({ success: true });
}
