import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { paperId } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const attempt = await prisma.mockAttempt.findFirst({
      where: {
        userId: session.user.id,
        paperId,
        status: "IN_PROGRESS"
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(attempt || null);
  } catch (error) {
    console.error("Resume fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { paperId } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { answersJson, timeLeft } = await request.json();

    const existing = await prisma.mockAttempt.findFirst({
      where: {
        userId: session.user.id,
        paperId,
        status: "IN_PROGRESS"
      },
      orderBy: { updatedAt: "desc" }
    });

    if (existing) {
      const updated = await prisma.mockAttempt.update({
        where: { id: existing.id },
        data: {
          answersJson,
          timeLeft,
          updatedAt: new Date()
        }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.mockAttempt.create({
        data: {
          userId: session.user.id,
          paperId,
          answersJson,
          timeLeft,
          status: "IN_PROGRESS"
        }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { paperId } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all IN_PROGRESS attempts for this paper/user to force a clean slate
    await prisma.mockAttempt.deleteMany({
      where: {
        userId: session.user.id,
        paperId,
        status: "IN_PROGRESS"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fresh start wipe error:", error);
    return NextResponse.json({ error: "Failed to clear existing session" }, { status: 500 });
  }
}
