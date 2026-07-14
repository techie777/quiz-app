import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const skip = parseInt(searchParams.get("skip") || "0");
  const take = parseInt(searchParams.get("take") || "20");

  const whereClause = {
    ...(groupId ? { groupId } : {}),
    isHidden: false,
    isDeleted: false,
  };

  if (userId) {
    whereClause.OR = [
      { status: "APPROVED" },
      { authorId: userId }
    ];
  } else {
    whereClause.status = "APPROVED";
  }

  try {
    const topics = await prisma.forumTopic.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take,
      include: {
        author: {
          select: { id: true, name: true, image: true, isPro: true, proBadge: true, avatar: true }
        },
        _count: {
          select: { comments: { where: { isHidden: false } }, likes: true }
        }
      }
    });

    const total = await prisma.forumTopic.count({
      where: whereClause
    });

    return NextResponse.json({ topics, total });
  } catch (error) {
    console.error("Forum Topics GET Error:", error);
    return NextResponse.json({ error: "Failed to load topics" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, content, groupId } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isPro: true, forumBanUntil: true }
    });

    if (user.forumBanUntil && new Date(user.forumBanUntil) > new Date()) {
      return NextResponse.json({ error: "You are banned from posting in the forum until " + new Date(user.forumBanUntil).toLocaleDateString() }, { status: 403 });
    }

    // 3-POST LIMIT CHECK
    if (!user.isPro) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const postCount = await prisma.forumTopic.count({
        where: {
          authorId: user.id,
          createdAt: { gte: today }
        }
      });

      if (postCount >= 3) {
        return NextResponse.json({ error: "FREE_LIMIT_REACHED", message: "You have reached your daily limit of 3 posts. Upgrade to PRO to post unlimited topics!" }, { status: 403 });
      }
    }

    const topic = await prisma.forumTopic.create({
      data: {
        title,
        content,
        groupId: groupId || null,
        authorId: user.id,
        status: "PENDING"
      }
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Forum Topics POST Error:", error);
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}
