import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSchoolSeed } from "@/lib/schoolSeed";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchoolSeed();

  const boardId = params.boardId;
  const classNumber = Number(params.classNumber);
  if (!Number.isFinite(classNumber)) {
    return NextResponse.json({ error: "Invalid class" }, { status: 400 });
  }

  const board = await prisma.schoolBoard.findUnique({
    where: { id: boardId },
    select: { id: true, name: true, hidden: true },
  });
  if (!board || board.hidden) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { boardId_number: { boardId, number: classNumber } },
    select: { id: true, number: true },
  });
  if (!schoolClass) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subjects = await prisma.schoolSubject.findMany({
    where: { classId: schoolClass.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ board, class: schoolClass, subjects });
}

