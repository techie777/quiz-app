import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const factId = searchParams.get("factId");

    if (!factId) return NextResponse.json({ error: "factId required" }, { status: 400 });

    const comments = await prisma.funFactComment.findMany({
      where: { factId },
      include: {
        user: { select: { id: true, name: true, avatar: true, image: true, nickname: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { factId, content } = await req.json();
    if (!factId || !content?.trim()) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const comment = await prisma.funFactComment.create({
      data: {
        factId,
        userId: session.user.id,
        content: content.trim()
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, image: true, nickname: true } }
      }
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
