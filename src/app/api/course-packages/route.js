import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const board = searchParams.get("board");
  const classNum = searchParams.get("class");

  try {
    const where = { hidden: false };
    if (board) where.board = board;
    if (classNum) where.class = parseInt(classNum, 10);

    const packages = await prisma.coursePackage.findMany({
      where,
      orderBy: { class: "asc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching course packages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
