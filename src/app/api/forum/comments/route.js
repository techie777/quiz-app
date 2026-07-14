import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get("topicId");

  if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });

  try {
    const comments = await prisma.forumComment.findMany({
      where: { topicId, isHidden: false },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, image: true, isPro: true, proBadge: true, avatar: true }
        },
        _count: { select: { likes: true, replies: { where: { isHidden: false } } } }
      }
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { content, topicId, parentId } = await req.json();

    if (!content || !topicId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { forumBanUntil: true }
    });

    if (user.forumBanUntil && new Date(user.forumBanUntil) > new Date()) {
      return NextResponse.json({ error: "You are banned from commenting." }, { status: 403 });
    }

    const comment = await prisma.forumComment.create({
      data: {
        content,
        topicId,
        parentId: parentId || null,
        authorId: session.user.id
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, isPro: true, proBadge: true, avatar: true }
        }
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
