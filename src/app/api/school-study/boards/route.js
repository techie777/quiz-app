import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";
import { enforceRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const rl = enforceRateLimit(rateLimitKey(request, "api:school:boards:get"), { windowMs: 60_000, max: 60 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const boards = await prisma.schoolBoard.findMany({
    where: { hidden: false },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json(boards);
}

