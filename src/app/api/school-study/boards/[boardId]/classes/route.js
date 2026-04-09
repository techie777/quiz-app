import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import { enforceRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const rl = enforceRateLimit(rateLimitKey(request, "api:school:classes:get"), { windowMs: 60_000, max: 60 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const boardId = params.boardId;
  const board = await prisma.schoolBoard.findUnique({
    where: { id: boardId },
    select: { id: true, name: true, hidden: true },
  });
  if (!board || board.hidden) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const classes = await prisma.schoolClass.findMany({
    where: { boardId: board.id },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });

  return NextResponse.json({ board, classes });
}

