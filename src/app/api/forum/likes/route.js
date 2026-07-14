import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topicId, commentId } = await req.json();

    if (!topicId && !commentId) {
      return NextResponse.json({ error: "Requires topicId or commentId" }, { status: 400 });
    }

    // Toggle logic
    const existingLike = await prisma.forumLike.findFirst({
      where: {
        userId: session.user.id,
        topicId: topicId || null,
        commentId: commentId || null
      }
    });

    if (existingLike) {
      await prisma.forumLike.delete({ where: { id: existingLike.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.forumLike.create({
        data: {
          userId: session.user.id,
          topicId: topicId || null,
          commentId: commentId || null
        }
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
