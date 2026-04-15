import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { factId, action } = await req.json();
    if (!factId || !["like", "favorite"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = session.user.id;

    if (action === "like") {
      const existing = await prisma.funFactLike.findUnique({
        where: { userId_factId: { userId, factId } }
      });
      if (existing) {
        await prisma.funFactLike.delete({ where: { id: existing.id } });
      } else {
        await prisma.funFactLike.create({ data: { userId, factId } });
      }
      return NextResponse.json({ success: true, liked: !existing });
    }

    if (action === "favorite") {
      const existing = await prisma.funFactFavorite.findUnique({
        where: { userId_factId: { userId, factId } }
      });
      if (existing) {
        await prisma.funFactFavorite.delete({ where: { id: existing.id } });
      } else {
        await prisma.funFactFavorite.create({ data: { userId, factId } });
      }
      return NextResponse.json({ success: true, favorited: !existing });
    }

  } catch (error) {
    console.error("FunFact interaction error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
