import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Fetch the target fact
    const rawFact = await prisma.funFact.findUnique({
      where: { id },
      include: {
        category: true,
        _count: { select: { likes: true, favorites: true, comments: true } },
        ...(userId && {
          likes: { where: { userId }, select: { id: true } },
          favorites: { where: { userId }, select: { id: true } }
        })
      }
    });

    if (!rawFact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Track views asynchronously
    await prisma.funFact.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    // Formatting User Interaction Flags
    const hasLiked = userId ? rawFact.likes.length > 0 : false;
    const hasFavorited = userId ? rawFact.favorites.length > 0 : false;
    const { likes, favorites, ...fact } = rawFact;

    // Fetch chronological neighbors based on createdAt
    const [nextFact, prevFact] = await Promise.all([
      prisma.funFact.findFirst({
        where: { createdAt: { lt: fact.createdAt }, hidden: false },
        orderBy: { createdAt: "desc" },
        select: { id: true }
      }),
      prisma.funFact.findFirst({
        where: { createdAt: { gt: fact.createdAt }, hidden: false },
        orderBy: { createdAt: "asc" },
        select: { id: true }
      })
    ]);

    return NextResponse.json({ 
      fact, 
      hasLiked, 
      hasFavorited,
      nextId: nextFact?.id || null, 
      prevId: prevFact?.id || null 
    }, { status: 200 });

  } catch (error) {
    console.error("Fetch single fact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
