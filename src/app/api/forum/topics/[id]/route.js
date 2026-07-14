import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true, isPro: true, proBadge: true, avatar: true }
        },
        group: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { likes: true, comments: { where: { isHidden: false } } }
        }
      }
    });

    if (!topic || topic.isHidden) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Increment view count in background
    prisma.forumTopic.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    }).catch(() => {});

    return NextResponse.json(topic);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load topic" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const topic = await prisma.forumTopic.findUnique({ where: { id } });
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    if (topic.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.forumTopic.update({
      where: { id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
